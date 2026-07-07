// Global send scheduler for EarlyWhistle (52B). One bot → one flood-control budget, so ALL Telegram sends
// (posts, edits, pins, photos) flow through here.
//   - global 25/s token bucket (across every match)
//   - priority: events (goal/settled posts, pins, photos) always beat edits; an event is never dropped
//   - edits are COALESCED per message (only the latest render matters) → stale edit cycles drop themselves
//   - per-message edit throttle ≥ 4s
//   - 429 → back off for retry_after, re-queue the job (superseded edits excepted)
// pump(now) is the unit of work — deterministic for tests; production drives it on a short interval.
import { TgApiError } from "./tg";

const MAX_EVENT_ATTEMPTS = 5; // an event is retried on transient errors, but bounded so a permanent failure can't hot-loop
const DEFAULT_BACKOFF_MS = 1000; // used for a 429 with no retry_after, and to space transient-error event retries

export interface SchedulerStats {
  sent: number;
  rateLimited: number;
  errors: number;
  editsSuperseded: number;
}

interface EventJob {
  run: () => Promise<void>;
  label: string;
  attempts?: number;
}
interface EditJob {
  run: () => Promise<void>;
}
type Job = { kind: "event"; job: EventJob } | { kind: "edit"; key: string; job: EditJob };

export interface SchedulerOpts {
  ratePerSec?: number; // default 25
  capacity?: number; // burst, default = ratePerSec
  editThrottleMs?: number; // default 4000
  onError?: (label: string, err: unknown) => void;
}

export class Scheduler {
  private readonly events: EventJob[] = [];
  private readonly edits = new Map<string, EditJob>(); // coalesced: latest edit per message key
  private readonly lastEditAt = new Map<string, number>();
  private readonly ratePerSec: number;
  private readonly capacity: number;
  private readonly editThrottleMs: number;
  private readonly onError: (label: string, err: unknown) => void;
  private tokens: number;
  private lastRefill = -1; // -1 = uninitialized; 0 is a legit now(), so don't use it as the sentinel
  private pausedUntil = 0;
  private running = false; // re-entrancy guard: the interval-driven pump must never overlap itself
  readonly stats: SchedulerStats = { sent: 0, rateLimited: 0, errors: 0, editsSuperseded: 0 };
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(opts: SchedulerOpts = {}) {
    this.ratePerSec = opts.ratePerSec ?? 25;
    this.capacity = opts.capacity ?? this.ratePerSec;
    this.editThrottleMs = opts.editThrottleMs ?? 4000;
    this.onError = opts.onError ?? (() => {});
    this.tokens = this.capacity;
  }

  /** High priority. Never dropped — re-queued on 429. Fire-and-forget. */
  enqueueEvent(label: string, run: () => Promise<void>): void {
    this.events.push({ run, label });
  }

  /** Low priority, coalesced per message key: a newer render supersedes the pending one. Fire-and-forget. */
  enqueueEdit(key: string, run: () => Promise<void>): void {
    if (this.edits.has(key)) this.stats.editsSuperseded++;
    this.edits.set(key, { run });
  }

  hasWork(): boolean {
    return this.events.length > 0 || this.edits.size > 0;
  }

  /** Production driver: pump every tickMs. Returns a stop fn. */
  start(tickMs = 40): () => void {
    this.timer = setInterval(() => void this.pump(Date.now()), tickMs);
    return () => {
      if (this.timer) clearInterval(this.timer);
      this.timer = undefined;
    };
  }

  private refill(now: number): void {
    if (this.lastRefill < 0) {
      this.lastRefill = now; // first pump: start the clock, keep the full initial bucket
      return;
    }
    const elapsed = Math.max(0, now - this.lastRefill);
    this.tokens = Math.min(this.capacity, this.tokens + (elapsed / 1000) * this.ratePerSec);
    this.lastRefill = now;
  }

  private nextJob(now: number): Job | null {
    const ev = this.events.shift();
    if (ev) return { kind: "event", job: ev };
    for (const [key, job] of this.edits) {
      if (now - (this.lastEditAt.get(key) ?? Number.NEGATIVE_INFINITY) >= this.editThrottleMs) {
        this.edits.delete(key);
        return { kind: "edit", key, job };
      }
    }
    return null; // only throttled edits remain
  }

  /** Process as many eligible jobs as the budget allows at time `now`. */
  async pump(now: number): Promise<void> {
    if (this.running) return; // guard: an overlapping pump would read lastEditAt before this one writes it → double edit
    this.running = true;
    try {
      if (now < this.pausedUntil) return; // 429 backoff in effect
      this.refill(now);
      while (this.tokens >= 1) {
        const next = this.nextJob(now);
        if (!next) break;
        this.tokens -= 1;
        await this.dispatch(next, now);
        if (now < this.pausedUntil) break; // a 429 just paused us
      }
    } finally {
      this.running = false;
    }
  }

  private async dispatch(next: Job, now: number): Promise<void> {
    try {
      await next.job.run();
      this.stats.sent++;
      if (next.kind === "edit") this.lastEditAt.set(next.key, now);
    } catch (err) {
      const status = err instanceof TgApiError ? err.status : 0;
      if (status === 429) {
        // any 429 backs off (retry_after when present, else a default) and re-queues — even one that omits retry_after
        const retryS = (err instanceof TgApiError ? err.retryAfter : undefined) ?? DEFAULT_BACKOFF_MS / 1000;
        this.pausedUntil = now + retryS * 1000;
        this.stats.rateLimited++;
        this.requeue(next);
      } else {
        this.stats.errors++;
        this.onError(next.kind === "event" ? next.job.label : `edit:${next.key}`, err);
        // an EVENT is never dropped on a transient error: back off briefly and retry, bounded so a permanent
        // failure can't hot-loop. Edits are dropped (they self-heal via the next coalesced render).
        if (next.kind === "event") {
          const attempts = (next.job.attempts ?? 0) + 1;
          if (attempts < MAX_EVENT_ATTEMPTS) {
            next.job.attempts = attempts;
            this.pausedUntil = Math.max(this.pausedUntil, now + DEFAULT_BACKOFF_MS);
            this.events.unshift(next.job);
          }
        }
      }
    }
  }

  private requeue(next: Job): void {
    if (next.kind === "event") this.events.unshift(next.job);
    else if (!this.edits.has(next.key)) this.edits.set(next.key, next.job); // unless a newer render already superseded it
  }
}
