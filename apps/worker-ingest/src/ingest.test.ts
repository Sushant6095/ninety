// VERIFY: on replayed data XLEN odds.raw.v1 grows; duplicate injection drops dupes.
// Integration test vs the docker redis (skips if unreachable, so `pnpm test` stays green without infra).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Redis from "ioredis";
import { createBus } from "@omnipitch/bus";
import { TOPICS } from "@omnipitch/schema";
import type { OddsTick } from "@omnipitch/txline";
import { createPipeline } from "./ingest";
import { replayOddsTicks } from "./replayer";

const URL = process.env.REDIS_URL ?? "redis://localhost:6379";
let up = false;
let raw: Redis;

beforeAll(async () => {
  raw = new Redis(URL, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
  try {
    await raw.connect();
    await raw.ping();
    up = true;
  } catch {
    up = false;
  }
});
afterAll(async () => {
  await raw?.quit().catch(() => raw?.disconnect());
});

describe("ingest pipeline (integration)", () => {
  it("grows XLEN odds.raw.v1 with unique ticks and drops duplicates", async (ctx) => {
    if (!up) return void ctx.skip?.();
    const bus = await createBus();
    const redis = new Redis(URL, { maxRetriesPerRequest: 1, retryStrategy: () => null });
    const pipe = createPipeline(bus, redis, { logEvery: 1000 });

    // distinct real odds ticks (unique MessageId → unique source_seq)
    const unique = [...new Map(replayOddsTicks().map((t) => [t.MessageId, t])).values()] as OddsTick[];
    expect(unique.length).toBeGreaterThan(0);

    const before = Number(await raw.xlen(TOPICS.oddsRaw));
    for (const t of unique) await pipe.ingestOdds(t);
    const afterUnique = Number(await raw.xlen(TOPICS.oddsRaw));
    expect(afterUnique - before).toBe(unique.length); // odds.raw.v1 grew by #unique
    expect(pipe.stats.published).toBe(unique.length);

    // duplicate injection → dropped by (source, source_seq); XLEN must not grow
    await pipe.ingestOdds(unique[0]);
    const afterDup = Number(await raw.xlen(TOPICS.oddsRaw));
    expect(afterDup).toBe(afterUnique);
    expect(pipe.stats.dropped).toBeGreaterThanOrEqual(1);

    console.log(JSON.stringify({ evt: "ingest.test.ok", unique: unique.length, grew: afterUnique - before, ...pipe.stats }));
    await bus.close();
    await redis.quit().catch(() => redis.disconnect());
  }, 20000);
});
