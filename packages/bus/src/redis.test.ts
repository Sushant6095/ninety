import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import Redis from "ioredis";
import { randomUUID } from "node:crypto";
import { RedisBus } from "./redis";
import type { Envelope, Topic } from "@omnipitch/schema";

// Integration test — runs against the docker redis on REDIS_URL (localhost:6379).
// Skips (does not fail) if redis is unreachable, so `pnpm test` stays green without infra.
const URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let redisUp = false;
let raw: Redis;
const openBuses: RedisBus[] = [];

beforeAll(async () => {
  raw = new Redis(URL, { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
  try {
    await raw.connect();
    await raw.ping();
    redisUp = true;
  } catch {
    redisUp = false;
  }
});

afterEach(async () => {
  await Promise.all(openBuses.splice(0).map((b) => b.close().catch(() => {})));
});

afterAll(async () => {
  await raw?.quit().catch(() => raw?.disconnect());
});

// --- helpers ---
const mk = (): RedisBus => {
  const b = new RedisBus(URL);
  openBuses.push(b);
  return b;
};

let counter = 0;
const uid = () => `${Date.now()}-${++counter}`;
const asTopic = (s: string) => s as unknown as Topic; // ephemeral per-test stream, not a real TOPICS value

const env = (matchId: string, n: number): Envelope => ({
  event_id: randomUUID(),
  source: "engine",
  source_seq: n,
  match_id: matchId,
  ts_source: new Date().toISOString(),
  ts_ingest: new Date().toISOString(),
  type: "commentary",
  payload: { text: `msg ${n}` },
});

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (v: T) => void;
}
const deferred = <T>(): Deferred<T> => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const withTimeout = <T>(p: Promise<T>, ms: number, label = "timeout") =>
  Promise.race([p, delay(ms).then(() => Promise.reject(new Error(label)))]) as Promise<T>;

const pendingCount = async (topic: string, group: string): Promise<number> => {
  const res = (await raw.xpending(topic, group)) as [number, ...unknown[]];
  return Number(res?.[0] ?? 0);
};

describe("RedisBus (integration)", () => {
  it("publishes 3, consumes them in order, and acks all", async (ctx) => {
    if (!redisUp) return void ctx.skip?.();
    const topic = asTopic(`test.bus.order.${uid()}`);
    const group = "g";
    const bus = mk();

    await bus.publish(topic, "m", env("m", 1));
    await bus.publish(topic, "m", env("m", 2));
    await bus.publish(topic, "m", env("m", 3));

    const got: number[] = [];
    const done = deferred<void>();
    await bus.consume(
      topic,
      group,
      async (e) => {
        got.push(e.source_seq);
        if (got.length === 3) done.resolve();
      },
      { blockMs: 200 },
    );

    await withTimeout(done.promise, 8000, "did not receive 3");
    expect(got).toEqual([1, 2, 3]); // stream order preserved
    await delay(150); // let the final XACK land
    expect(await pendingCount(topic, group)).toBe(0); // nothing left unacked
  }, 15000);

  it("does not redeliver after a clean consumer restart", async (ctx) => {
    if (!redisUp) return void ctx.skip?.();
    const topic = asTopic(`test.bus.restart.${uid()}`);
    const group = "g";

    const busA = mk();
    for (let n = 1; n <= 3; n++) await busA.publish(topic, "m", env("m", n));

    const a: number[] = [];
    const doneA = deferred<void>();
    await busA.consume(
      topic,
      group,
      async (e) => {
        a.push(e.source_seq);
        if (a.length === 3) doneA.resolve();
      },
      { blockMs: 200 },
    );
    await withTimeout(doneA.promise, 8000, "A never drained");
    await delay(150);
    await busA.close(); // graceful: everything acked

    // restart on the same group
    const busB = mk();
    const b: number[] = [];
    await busB.consume(topic, group, async (e) => void b.push(e.source_seq), { blockMs: 200, minIdleMs: 200 });
    await delay(1500); // ample time for any (erroneous) redelivery

    expect(a).toEqual([1, 2, 3]);
    expect(b).toEqual([]); // zero redelivery
    expect(await pendingCount(topic, group)).toBe(0);
  }, 20000);

  it("redelivers exactly once when a consumer is killed mid-handle (XAUTOCLAIM)", async (ctx) => {
    if (!redisUp) return void ctx.skip?.();
    const topic = asTopic(`test.bus.kill.${uid()}`);
    const group = "g";

    const busA = mk();
    await busA.publish(topic, "m", env("m", 1));

    // A receives the entry and hangs mid-handle (never acks) — models a crash while processing.
    // Large minIdle so A never reclaims its own pending; recovery must come from B.
    const reading = deferred<void>();
    await busA.consume(
      topic,
      group,
      async () => {
        reading.resolve();
        await new Promise<void>(() => {}); // hang forever
      },
      { blockMs: 200, minIdleMs: 60_000 },
    );
    await withTimeout(reading.promise, 8000, "A never received");
    expect(await pendingCount(topic, group)).toBe(1); // delivered, unacked
    await busA.close(); // kill A (bounded shutdown; entry left pending)

    // B reclaims A's orphaned entry via XAUTOCLAIM once idle > minIdleMs.
    const busB = mk();
    const b: number[] = [];
    const doneB = deferred<void>();
    await busB.consume(
      topic,
      group,
      async (e) => {
        b.push(e.source_seq);
        doneB.resolve();
      },
      { blockMs: 200, minIdleMs: 100 },
    );
    await withTimeout(doneB.promise, 8000, "B never reclaimed");
    await delay(500); // guard against a second delivery

    expect(b).toEqual([1]); // redelivered exactly once
    expect(await pendingCount(topic, group)).toBe(0); // and now acked
  }, 20000);
});
