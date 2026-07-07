// Per-stream heartbeat watchdog + gap recovery + reconnect (txline-integration skill: "SSE with heartbeat
// + gap detection; on gap → snapshot recovery, never quote blind"). A gap fires on either (a) >silenceMs
// with no frame at all (event OR keepalive heartbeat), or (b) the stream ending/erroring (network drop).
// On a gap during LIVE: recover() re-emits canonical events flagged recovered:true (deduped, so already-seen
// events are dropped and only truly-missed ones survive), onGap() publishes the feed.gap system event, then
// reconnect after backoff+jitter.

export interface GapInfo {
  stream: string;
  reason: "silence" | "closed" | "error";
  detail?: string;
  silentMs: number;
  recovered: number; // count of missed events re-emitted during recovery
  at: string;
}

export interface Clock {
  now(): number;
  sleep(ms: number): Promise<void>;
  rand(): number; // [0,1)
}

const realClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  rand: () => Math.random(),
};

export interface SuperviseConfig<T> {
  name: string;
  /** (re)open the stream; onHeartbeat is invoked by the client on keepalive frames (liveness). */
  open: (signal: AbortSignal, onHeartbeat: () => void) => AsyncIterable<T>;
  onEvent: (event: T) => Promise<void>;
  /** fetch snapshot + reconcile (re-emit recovered, deduped); returns # of missed events re-emitted. */
  recover: () => Promise<number>;
  /** publish the feed.gap system event. */
  onGap: (info: GapInfo) => Promise<void>;
  signal: AbortSignal;
  live?: boolean; // default true; when false (finite replay) a stream end is not treated as a gap
  silenceMs?: number; // watchdog window, default 20_000
  backoffBaseMs?: number; // default 500
  backoffMaxMs?: number; // default 30_000
  clock?: Clock; // injectable for deterministic tests
}

/** Supervise one stream until the signal aborts. Resolves when aborted. */
export async function superviseStream<T>(cfg: SuperviseConfig<T>): Promise<void> {
  const clock = cfg.clock ?? realClock;
  const silenceMs = cfg.silenceMs ?? 20_000;
  const backoffBase = cfg.backoffBaseMs ?? 500;
  const backoffMax = cfg.backoffMaxMs ?? 30_000;
  const live = cfg.live !== false;
  let backoff = backoffBase;

  // One abort listener for the whole supervisor (the signal never changes). Re-adding it per reconnect
  // leaks a listener each time — they only fire once, on stop() — tripping Node's MaxListeners warning
  // on a flapping feed.
  const TIMEOUT = Symbol("timeout");
  const ABORTED = Symbol("aborted");
  const abortP = new Promise<typeof ABORTED>((resolve) => {
    if (cfg.signal.aborted) resolve(ABORTED);
    else cfg.signal.addEventListener("abort", () => resolve(ABORTED), { once: true });
  });

  while (!cfg.signal.aborted) {
    let lastActivity = clock.now();
    const bump = () => (lastActivity = clock.now()); // heartbeat OR event resets the watchdog
    let gap: { reason: GapInfo["reason"]; detail?: string } | null = null;
    let sawEvent = false;

    const iterator = cfg.open(cfg.signal, bump)[Symbol.asyncIterator]();
    let pending = iterator.next(); // keep ONE outstanding next() so racing the watchdog never double-advances
    try {
      for (;;) {
        if (cfg.signal.aborted) {
          iterator.return?.(undefined)?.catch(() => {}); // fire-and-forget: a generator suspended on a pending await must not block us
          return;
        }
        // Watchdog: a cleared-on-progress real timer (not clock.sleep, so no dangling timers when an event wins).
        const remaining = Math.max(0, silenceMs - (clock.now() - lastActivity));
        let timer: ReturnType<typeof setTimeout> | undefined;
        const timeoutP = new Promise<typeof TIMEOUT>((resolve) => {
          timer = setTimeout(() => resolve(TIMEOUT), remaining);
        });
        const raced = await Promise.race([pending.then((r) => ({ r })), timeoutP, abortP]);
        if (timer) clearTimeout(timer);
        if (raced === ABORTED) {
          iterator.return?.(undefined)?.catch(() => {}); // fire-and-forget: a generator suspended on a pending await must not block us
          return;
        }
        if (raced === TIMEOUT) {
          if (clock.now() - lastActivity >= silenceMs) {
            gap = { reason: "silence", detail: `no frame for ${silenceMs}ms` };
            iterator.return?.(undefined)?.catch(() => {}); // fire-and-forget: a generator suspended on a pending await must not block us
            break;
          }
          continue; // a heartbeat bumped lastActivity; re-race the SAME pending next()
        }
        const { done, value } = (raced as { r: IteratorResult<T> }).r;
        if (done) {
          gap = { reason: "closed", detail: "stream ended" };
          break;
        }
        bump();
        sawEvent = true;
        await cfg.onEvent(value);
        pending = iterator.next();
      }
    } catch (err) {
      gap = { reason: "error", detail: String((err as Error)?.message ?? err) };
      iterator.return?.(undefined)?.catch(() => {}); // close the suspended generator's socket, like every other exit path
    }

    if (cfg.signal.aborted) return;

    // Recover + flag the gap (only during LIVE; a finite replay that simply ends is not a gap).
    if (gap && (live || gap.reason !== "closed")) {
      let recovered = 0;
      try {
        recovered = await cfg.recover();
      } catch (err) {
        console.error(JSON.stringify({ evt: "ingest.recover.error", stream: cfg.name, msg: String((err as Error)?.message ?? err) }));
      }
      await cfg.onGap({
        stream: cfg.name,
        reason: gap.reason,
        detail: gap.detail,
        silentMs: clock.now() - lastActivity,
        recovered,
        at: new Date(clock.now()).toISOString(),
      });
    } else if (gap && gap.reason === "closed") {
      return; // finite replay finished cleanly
    }

    // Reconnect with exponential backoff + jitter (reset backoff after a stream that made progress).
    const wait = Math.min(backoffMax, backoff) + Math.floor(clock.rand() * Math.min(backoffMax, backoff));
    await Promise.race([clock.sleep(wait), abortP]); // wake immediately on stop() instead of hanging out the full backoff
    backoff = sawEvent ? backoffBase : Math.min(backoffMax, backoff * 2);
  }
}
