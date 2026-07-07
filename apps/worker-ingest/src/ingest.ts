// Ingest pipeline: SSE (odds/scores via packages/txline) → normalizer → dedup → publish (odds.raw / match.events).
// Fixtures polled → compacted upserts (latest-per-fixtureId in a Redis hash — a compacted reference store,
// distinct from the append-only event streams; ADR-018). Structured log every N ticks.
import Redis from "ioredis";
import { TOPICS, type Envelope, type Topic } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";
import type { TxLineClient, OddsTick, ScoreState, Fixture } from "@omnipitch/txline";
import { normalizeOdds, normalizeScore, Dedup } from "./normalizer";

const FIXTURES_HASH = "fixtures:current"; // compacted: field = fixtureId, value = latest fixture json

export interface IngestStats {
  processed: number;
  published: number;
  dropped: number;
  odds: number;
  scores: number;
  fixturesUpserted: number;
}

export interface Pipeline {
  ingestOdds(tick: OddsTick): Promise<void>;
  ingestScore(state: ScoreState): Promise<void>;
  upsertFixtures(fixtures: Fixture[]): Promise<number>;
  stats: IngestStats;
}

export function createPipeline(bus: Bus, redis: Redis, opts: { logEvery?: number } = {}): Pipeline {
  const dedup = new Dedup();
  const logEvery = opts.logEvery ?? 100;
  const prevScore = new Map<string, ScoreState>();
  const stats: IngestStats = { processed: 0, published: 0, dropped: 0, odds: 0, scores: 0, fixturesUpserted: 0 };

  const maybeLog = () => {
    if (stats.processed > 0 && stats.processed % logEvery === 0) {
      console.log(JSON.stringify({ evt: "ingest.progress", ...stats, ts: new Date().toISOString() }));
    }
  };

  const publish = async (env: Envelope, topic: Topic): Promise<void> => {
    stats.processed++;
    if (!dedup.accept(env.source, env.source_seq)) {
      stats.dropped++; // idempotency: (source, source_seq) already seen
      maybeLog();
      return;
    }
    await bus.publish(topic, env.match_id, env); // partition key = match_id
    stats.published++;
    maybeLog();
  };

  return {
    stats,
    async ingestOdds(tick) {
      stats.odds++;
      await publish(normalizeOdds(tick), TOPICS.oddsRaw);
    },
    async ingestScore(state) {
      stats.scores++;
      const key = String(state.FixtureId);
      const prev = prevScore.get(key);
      prevScore.set(key, state);
      for (const env of normalizeScore(state, prev)) await publish(env, TOPICS.matchEvents);
    },
    async upsertFixtures(fixtures) {
      let changed = 0;
      for (const f of fixtures) {
        const field = String(f.FixtureId);
        const json = JSON.stringify(f);
        const current = await redis.hget(FIXTURES_HASH, field);
        if (current !== json) {
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

/** Live wiring: subscribe odds+scores SSE from a configured TxLineClient, poll fixtures on an interval. */
export async function runIngest(
  client: TxLineClient,
  bus: Bus,
  opts: { redisUrl?: string; fixturesIntervalMs?: number; logEvery?: number } = {},
): Promise<RunIngestHandle> {
  const redis = new Redis(opts.redisUrl ?? process.env.REDIS_URL ?? "redis://localhost:6379");
  const pipe = createPipeline(bus, redis, { logEvery: opts.logEvery });
  const ac = new AbortController();

  const oddsLoop = (async () => {
    for await (const tick of client.oddsStream({ signal: ac.signal })) await pipe.ingestOdds(tick);
  })().catch((e) => !ac.signal.aborted && console.error(JSON.stringify({ evt: "ingest.odds.error", msg: String(e?.message ?? e) })));

  const scoresLoop = (async () => {
    for await (const state of client.scoresStream({ signal: ac.signal })) await pipe.ingestScore(state);
  })().catch((e) => !ac.signal.aborted && console.error(JSON.stringify({ evt: "ingest.scores.error", msg: String(e?.message ?? e) })));

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
      ac.abort(); // stops the SSE streams via their AbortSignal
      await Promise.allSettled([oddsLoop, scoresLoop]);
      await redis.quit().catch(() => redis.disconnect());
    },
  };
}
