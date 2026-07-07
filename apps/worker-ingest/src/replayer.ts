// Reads archived TxLINE samples (docs/txline-samples/) and re-publishes through the SAME pipeline at Nx
// speed. Demo insurance + backtests + deterministic tests without live auth (TXLINE-MAP §2).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { OddsTick, ScoreState } from "@omnipitch/txline";
import { TOPICS, safeParseSysEvent } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";
import { createPipeline, type Pipeline } from "./ingest";
import type { Clock } from "./supervise";

const SAMPLES = fileURLToPath(new URL("../../../docs/txline-samples/", import.meta.url));
const realClock: Clock = { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)), rand: () => Math.random() };

export function loadSample<T = unknown>(name: string): T {
  return JSON.parse(readFileSync(`${SAMPLES}${name}.json`, "utf8")) as T;
}

/** All archived odds ticks (updates bucket + a live stream sample) as one replay list. */
export function replayOddsTicks(): OddsTick[] {
  const updates = loadSample<OddsTick[]>("odds-updates");
  const streamed = loadSample<OddsTick>("odds-stream-event");
  return [...updates, streamed];
}

/** Replay archived odds + scores through the pipeline. */
export async function replay(pipe: Pipeline): Promise<void> {
  for (const tick of replayOddsTicks()) await pipe.ingestOdds(tick);
  for (const state of loadSample<ScoreState[]>("scores-updates")) await pipe.ingestScore(state);
}

// --- Nx fixture replay (ADR-021): walk a finished fixture's buckets, re-timestamp relative to now, publish
// through the SAME topics at speed Nx. Concurrent replays are isolated by match_id (own pipeline each). ---

/** A time-ordered replay item: a raw score state or odds tick with its original wall-clock Ts. */
export type ReplayItem =
  | { ts: number; kind: "score"; state: ScoreState }
  | { ts: number; kind: "odds"; tick: OddsTick };

export interface ReplayStats {
  items: number;
  published: number;
  goals: number;
}

/** Load a finished fixture's archived score + odds buckets for one match, merged and time-ordered. */
export function loadFixtureBuckets(matchId: string): ReplayItem[] {
  const fid = Number(matchId);
  const scores = loadSample<ScoreState[]>("scores-updates").filter((s) => s.FixtureId === fid);
  const odds = loadSample<OddsTick[]>("odds-updates").filter((t) => t.FixtureId === fid);
  const items: ReplayItem[] = [
    ...scores.map((state) => ({ ts: state.Ts ?? 0, kind: "score" as const, state })),
    ...odds.map((tick) => ({ ts: tick.Ts ?? 0, kind: "odds" as const, tick })),
  ];
  return items.sort((a, b) => a.ts - b.ts);
}

/** Walk buckets at Nx, re-timestamping each event relative to replay start (wall-clock now) and publishing
 *  via a fresh pipeline to the SAME topics. Only the wall-clock Ts is rescaled — the in-game clock (minute)
 *  is untouched, so a goal keeps its real match minute while landing at the scaled relative moment. */
export async function replayItems(
  items: ReplayItem[],
  opts: {
    matchId: string;
    speed: number;
    bus: Bus;
    clock?: Clock;
    signal?: AbortSignal;
    onPublish?: (p: { kind: "score" | "odds"; at: number; goals: number }) => void;
  },
): Promise<ReplayStats> {
  const clock = opts.clock ?? realClock;
  const speed = opts.speed > 0 ? opts.speed : 1;
  // Own pipeline per replay → concurrent replays isolated by match_id; replay:true stamps source=replay so
  // downstream can never mistake a replay of a live match for real market data (single-writer engine has no admin path).
  const pipe = createPipeline(opts.bus, undefined, { replay: true });
  const stats: ReplayStats = { items: items.length, published: 0, goals: 0 };
  if (!items.length) return stats;
  // Wait is abort-aware so stop() interrupts a long inter-event sleep at low speed (not just between events).
  const abortP = opts.signal
    ? new Promise<void>((r) => (opts.signal!.aborted ? r() : opts.signal!.addEventListener("abort", () => r(), { once: true })))
    : null;
  const t0 = items[0].ts;
  const startedAt = clock.now();
  for (const item of items) {
    if (opts.signal?.aborted) break;
    const targetElapsed = (item.ts - t0) / speed;
    const waitMs = targetElapsed - (clock.now() - startedAt);
    if (waitMs > 0) await (abortP ? Promise.race([clock.sleep(waitMs), abortP]) : clock.sleep(waitMs));
    if (opts.signal?.aborted) break; // aborted during the wait
    const newTs = Math.round(startedAt + targetElapsed); // re-timestamp relative to now; game clock untouched
    let goals = 0;
    if (item.kind === "score") goals = await pipe.ingestScore({ ...item.state, Ts: newTs }, false);
    else await pipe.ingestOdds({ ...item.tick, Ts: newTs }, false);
    stats.goals += goals;
    stats.published = pipe.stats.published;
    opts.onPublish?.({ kind: item.kind, at: clock.now(), goals });
  }
  return stats;
}

/** Replay a finished fixture from its archived buckets at Nx. */
export function replayFixture(opts: {
  matchId: string;
  speed: number;
  bus: Bus;
  clock?: Clock;
  signal?: AbortSignal;
}): Promise<ReplayStats> {
  return replayItems(loadFixtureBuckets(opts.matchId), opts);
}

const MAX_CONCURRENT_REPLAYS = 8; // bounds fan-out from the admin endpoint (each replay = a pipeline + timer loop)

/** One replay per match_id (isolation): concurrent replays of DIFFERENT matches run in parallel, each with
 *  its own pipeline; a duplicate match_id is rejected, not queued. Total concurrency is capped. */
export class ReplayManager {
  private readonly active = new Map<string, { ac: AbortController; done: Promise<ReplayStats> }>();
  constructor(
    private readonly bus: Bus,
    private readonly clock?: Clock,
    private readonly maxConcurrent: number = MAX_CONCURRENT_REPLAYS,
  ) {}
  isActive(matchId: string): boolean {
    return this.active.has(matchId);
  }
  activeMatches(): string[] {
    return [...this.active.keys()];
  }
  start(matchId: string, speed: number): { started: boolean; reason?: string } {
    if (this.active.has(matchId)) return { started: false, reason: "already replaying this match" };
    if (this.active.size >= this.maxConcurrent) return { started: false, reason: "too many concurrent replays" };
    const ac = new AbortController();
    const done = replayFixture({ matchId, speed, bus: this.bus, clock: this.clock, signal: ac.signal })
      .catch((e): ReplayStats => {
        console.error(JSON.stringify({ evt: "replay.error", matchId, msg: String((e as Error)?.message ?? e) }));
        return { items: 0, published: 0, goals: 0 };
      })
      .finally(() => this.active.delete(matchId));
    this.active.set(matchId, { ac, done });
    return { started: true };
  }
  async stop(matchId: string): Promise<void> {
    const e = this.active.get(matchId);
    if (!e) return;
    e.ac.abort();
    await e.done.catch(() => {});
  }
  async stopAll(): Promise<void> {
    await Promise.all(this.activeMatches().map((m) => this.stop(m)));
  }
}

/** Serve replay_request signals off the bus system plane (ADR-020/021): each drives ReplayManager.start. */
export async function startReplayService(bus: Bus, clock?: Clock): Promise<ReplayManager> {
  const mgr = new ReplayManager(bus, clock);
  await bus.consume(TOPICS.sysSignals, "worker-ingest-replay", async (raw) => {
    const parsed = safeParseSysEvent(raw); // validate at the boundary even though the type is inferred

    if (!parsed.success || parsed.data.kind !== "replay_request") return; // ignore every other signal/kind
    const { match_id, speed } = parsed.data.payload;
    const r = mgr.start(match_id, speed);
    console.log(JSON.stringify({ evt: "replay.request", match_id, speed, ...r }));
  });
  return mgr;
}
