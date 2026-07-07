// Ingest pipeline: SSE (odds/scores via packages/txline) → normalizer → dedup → publish (odds.raw / match.events).
// Fixtures polled → compacted upserts (Redis hash, ADR-018). Per-stream heartbeat watchdog + gap recovery
// via superviseStream: on >20s silence or a dropped connection, fetch a snapshot, re-emit missed events
// (recovered:true, deduped), publish the feed.gap system event, reconnect with backoff+jitter.
import Redis from "ioredis";
import { TOPICS, type Envelope, type Topic } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";
import type { TxLineClient, OddsTick, ScoreState, Fixture } from "@omnipitch/txline";
import { normalizeOdds, normalizeScore, Dedup } from "./normalizer";
import { superviseStream, type GapInfo } from "./supervise";

const FIXTURES_HASH = "fixtures:current"; // compacted: field = fixtureId, value = latest fixture json
export const FEED_GAP_STREAM = "feed.gap.v1"; // system/ops stream (not a domain AnyEvent) — feed gap alerts

export interface IngestStats {
  processed: number;
  published: number;
  dropped: number;
  odds: number;
  scores: number;
  fixturesUpserted: number;
  gaps: number;
  recovered: number;
}

export interface Pipeline {
  ingestOdds(tick: OddsTick, recovered?: boolean): Promise<number>; // returns # published (0|1)
  ingestScore(state: ScoreState, recovered?: boolean): Promise<number>; // returns # goal events published
  upsertFixtures(fixtures: Fixture[]): Promise<number>;
  activeFixtures(): string[];
  stats: IngestStats;
}

export function createPipeline(bus: Bus, redis?: Redis, opts: { logEvery?: number } = {}): Pipeline {
  const dedup = new Dedup();
  const logEvery = opts.logEvery ?? 100;
  const prevScore = new Map<string, ScoreState>();
  const seen = new Set<string>(); // fixtureIds seen — recovery targets these
  const stats: IngestStats = { processed: 0, published: 0, dropped: 0, odds: 0, scores: 0, fixturesUpserted: 0, gaps: 0, recovered: 0 };

  const maybeLog = () => {
    if (stats.processed > 0 && stats.processed % logEvery === 0) {
      console.log(JSON.stringify({ evt: "ingest.progress", ...stats, ts: new Date().toISOString() }));
    }
  };

  const publish = async (env: Envelope, topic: Topic): Promise<boolean> => {
    stats.processed++;
    if (dedup.has(env.source, env.source_seq)) {
      stats.dropped++; // idempotency: (source, source_seq) already seen → drop (no duplicate)
      maybeLog();
      return false;
    }
    await bus.publish(topic, env.match_id, env); // partition key = match_id — may throw; nothing mutated yet
    dedup.add(env.source, env.source_seq); // journal-then-ack: mark seen only after the emit is acknowledged
    stats.published++;
    maybeLog();
    return true;
  };

  return {
    stats,
    activeFixtures: () => [...seen],
    async ingestOdds(tick, recovered = false) {
      stats.odds++;
      seen.add(String(tick.FixtureId));
      return (await publish(normalizeOdds(tick, recovered), TOPICS.oddsRaw)) ? 1 : 0;
    },
    async ingestScore(state, recovered = false) {
      stats.scores++;
      const key = String(state.FixtureId);
      seen.add(key);
      const prev = prevScore.get(key); // diff vs last-known state → discrete goal events
      // Drop stale/replayed states (e.g. a lagging recovery snapshot): advancing prevScore backwards would
      // re-derive an already-published goal on the next live frame → a duplicate. Only move forward.
      const curSeq = state.Seq;
      const prevSeq = prev?.Seq;
      if (prev && typeof curSeq === "number" && typeof prevSeq === "number" && curSeq <= prevSeq) return 0;
      let n = 0;
      // ponytail: if a later goal in a multi-goal delta fails to publish, prevScore isn't advanced so recovery
      // re-derives the whole delta — an earlier same-team goal could then re-emit. Only reachable on a recovery
      // snapshot (live sends one goal per state); tighten to per-goal journaling if that partial-failure bites.
      for (const env of normalizeScore(state, prev, recovered)) if (await publish(env, TOPICS.matchEvents)) n++;
      prevScore.set(key, state); // advance only after the delta's goals are published (journal-then-ack)
      return n;
    },
    async upsertFixtures(fixtures) {
      if (!redis) throw new Error("upsertFixtures requires a redis handle");
      let changed = 0;
      for (const f of fixtures) {
        const field = String(f.FixtureId);
        const json = JSON.stringify(f);
        if ((await redis.hget(FIXTURES_HASH, field)) !== json) {
          await redis.hset(FIXTURES_HASH, field, json); // compacted upsert: keep only the latest per fixture
          changed++;
        }
      }
      stats.fixturesUpserted += changed;
      return changed;
    },
  };
}

export interface RunIngestHandle {
  stop(): Promise<void>;
  stats: IngestStats;
}

/** Live wiring: supervise odds+scores SSE (heartbeat watchdog + gap recovery), poll fixtures. */
export async function runIngest(
  client: TxLineClient,
  bus: Bus,
  opts: { redisUrl?: string; fixturesIntervalMs?: number; logEvery?: number; silenceMs?: number } = {},
): Promise<RunIngestHandle> {
  const redis = new Redis(opts.redisUrl ?? process.env.REDIS_URL ?? "redis://localhost:6379");
  const pipe = createPipeline(bus, redis, { logEvery: opts.logEvery });
  const ac = new AbortController();

  // Recovery: fetch a fresh snapshot per active fixture and re-emit missed events (recovered, deduped).
  const reconcileScores = async (): Promise<number> => {
    let n = 0;
    for (const fid of pipe.activeFixtures()) {
      try {
        const snap = await client.scoresSnapshot(fid);
        const state = (Array.isArray(snap) ? snap[0] : snap) as ScoreState | undefined;
        if (state) n += await pipe.ingestScore(state, true);
      } catch (e) {
        console.error(JSON.stringify({ evt: "ingest.reconcile.scores.error", fid, msg: String((e as Error)?.message ?? e) }));
      }
    }
    return n;
  };
  const reconcileOdds = async (): Promise<number> => {
    let n = 0;
    for (const fid of pipe.activeFixtures()) {
      try {
        for (const t of (await client.oddsSnapshot(fid)) as OddsTick[]) n += await pipe.ingestOdds(t, true);
      } catch (e) {
        console.error(JSON.stringify({ evt: "ingest.reconcile.odds.error", fid, msg: String((e as Error)?.message ?? e) }));
      }
    }
    return n;
  };

  const onGap = async (info: GapInfo): Promise<void> => {
    pipe.stats.gaps++;
    pipe.stats.recovered += info.recovered;
    await redis.xadd(FEED_GAP_STREAM, "MAXLEN", "~", 10_000, "*", "data", JSON.stringify(info));
    console.log(JSON.stringify({ evt: "feed.gap", ...info }));
  };

  const scoresSup = superviseStream<ScoreState>({
    name: "scores",
    signal: ac.signal,
    silenceMs: opts.silenceMs,
    open: (signal, onHeartbeat) => client.scoresStream({ signal, onHeartbeat }),
    onEvent: async (state) => void (await pipe.ingestScore(state)),
    recover: reconcileScores,
    onGap,
  });
  const oddsSup = superviseStream<OddsTick>({
    name: "odds",
    signal: ac.signal,
    silenceMs: opts.silenceMs,
    open: (signal, onHeartbeat) => client.oddsStream({ signal, onHeartbeat }),
    onEvent: async (tick) => void (await pipe.ingestOdds(tick)),
    recover: reconcileOdds,
    onGap,
  });

  const poll = async () => {
    try {
      await pipe.upsertFixtures((await client.fixtures()) as Fixture[]);
    } catch (e) {
      console.error(JSON.stringify({ evt: "ingest.fixtures.error", msg: String((e as Error)?.message ?? e) }));
    }
  };
  await poll();
  const timer = setInterval(poll, opts.fixturesIntervalMs ?? 60_000);

  return {
    stats: pipe.stats,
    async stop() {
      clearInterval(timer);
      ac.abort(); // stops the supervisors + their SSE streams
      await Promise.allSettled([scoresSup, oddsSup]);
      await redis.quit().catch(() => redis.disconnect());
    },
  };
}
