import { describe, it, expect } from "vitest";
import { Journal, MemJournalStore, RedisJournalStore, JournalError, hashState } from "./journal";
import { transition, initialMarket, IllegalTransitionError, TRIGGERS, type MarketState, type MarketCommand } from "./market";

// Total reducer for replay: park illegal (return state unchanged) so replay === live and reduce never throws.
const safeReduce = (s: MarketState, cmd: MarketCommand): MarketState => {
  try {
    return transition(s, cmd).state;
  } catch (e) {
    if (e instanceof IllegalTransitionError) return s;
    throw e;
  }
};
const marketJournal = (store: MemJournalStore<MarketCommand, MarketState> | RedisJournalStore<MarketCommand, MarketState>, snapshotEvery?: number) =>
  new Journal<MarketCommand, MarketState>({ store, reduce: safeReduce, seed: (key, first) => initialMarket(key, key, first.at), hash: hashState, snapshotEvery });

// deterministic seeded PRNG so the "random" runs are reproducible
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0xffffffff);
}
function randomCmd(r: () => number, at: number): MarketCommand {
  const trig = TRIGGERS[Math.floor(r() * TRIGGERS.length)];
  if (trig === "settle") return { trigger: "settle", at, result: "H", sig: "sig" };
  if (trig === "pivot") return { trigger: "pivot", at, reason: r() < 0.5 ? "goal" : "red" };
  return { trigger: trig, at };
}

describe("journal — replay fidelity (property)", () => {
  it("replays an evolving reducer to an identical hash across 10k commands (snapshot + tail)", async () => {
    const store = new MemJournalStore<number, { acc: number; count: number }>();
    const j = new Journal<number, { acc: number; count: number }>({
      store,
      reduce: (s, c) => ({ acc: (s.acc * 31 + c) >>> 0, count: s.count + 1 }), // state changes on EVERY command
      seed: () => ({ acc: 0, count: 0 }),
      hash: hashState,
      snapshotEvery: 1000,
    });
    const r = rng(7);
    let live = { acc: 0, count: 0 };
    const N = 10_500; // crosses ten snapshot boundaries and leaves a 500-command tail to replay
    for (let i = 0; i < N; i++) {
      const c = Math.floor(r() * 1e6);
      const n = await j.append("k", c);
      live = { acc: (live.acc * 31 + c) >>> 0, count: live.count + 1 };
      await j.maybeSnapshot("k", live, n);
    }
    const rec = await j.recover("k");
    expect(rec).not.toBeNull();
    expect(rec!.state).toEqual(live);
    expect(j.hash(rec!.state)).toBe(j.hash(live));
    expect(rec!.n).toBe(N - 1);
  });

  it("replays 10k random market commands to the identical MarketState hash", async () => {
    const store = new MemJournalStore<MarketCommand, MarketState>();
    const j = marketJournal(store); // default snapshotEvery 10_000
    const r = rng(42);
    let live = initialMarket("m1", "m1", 1000);
    let at = 1000;
    const N = 10_500; // cross the 10k snapshot boundary, leaving a 500-entry tail
    for (let i = 0; i < N; i++) {
      at += 1 + Math.floor(r() * 50);
      const cmd = randomCmd(r, at);
      const n = await j.append("m1", cmd); // journal BEFORE apply
      live = safeReduce(live, cmd); // apply live
      await j.maybeSnapshot("m1", live, n);
    }
    const rec = await j.recover("m1");
    expect(j.hash(rec!.state)).toBe(j.hash(live));
    expect(rec!.state).toEqual(live);
  });

  it("crash-simulated recovery equals the live state", async () => {
    const store = new MemJournalStore<MarketCommand, MarketState>();
    const j = marketJournal(store, 1000);
    const r = rng(3);
    let live = initialMarket("m1", "m1", 1000);
    let at = 1000;
    for (let i = 0; i < 2500; i++) {
      at += 1 + Math.floor(r() * 10);
      const cmd = randomCmd(r, at);
      const n = await j.append("m1", cmd);
      live = safeReduce(live, cmd);
      await j.maybeSnapshot("m1", live, n);
    }
    // "crash": throw away the live handle and rebuild purely from the journal
    const rec = await marketJournal(store, 1000).recover("m1");
    expect(j.hash(rec!.state)).toBe(j.hash(live));
  });
});

describe("journal — edge cases", () => {
  it("crash after append-before-apply → recovery applies the command EXACTLY once", async () => {
    const store = new MemJournalStore<MarketCommand, MarketState>();
    const j = marketJournal(store, 1000);
    let live = initialMarket("m1", "m1", 1000);
    for (const c of [{ trigger: "open", at: 1001 }, { trigger: "kickoff", at: 1002 }] as MarketCommand[]) {
      const n = await j.append("m1", c);
      live = safeReduce(live, c);
      await j.maybeSnapshot("m1", live, n);
    }
    // a goal arrives: it is APPENDED but the process crashes BEFORE apply (live is not advanced)
    const goal: MarketCommand = { trigger: "pivot", at: 1003, reason: "goal" };
    await j.append("m1", goal);
    const rec = await j.recover("m1");
    const expected = safeReduce(live, goal); // live with the goal applied ONCE
    expect(j.hash(rec!.state)).toBe(j.hash(expected));
    expect(rec!.state.status).toBe("HALTED"); // the journaled-but-unapplied goal was recovered
  });

  it("torn/corrupt snapshot (hash mismatch) → hard error, never a silent wrong state", async () => {
    const store = new MemJournalStore<MarketCommand, MarketState>();
    const j = marketJournal(store, 2); // snapshot every 2 commands
    let live = initialMarket("m1", "m1", 1000);
    for (const c of [{ trigger: "open", at: 1001 }, { trigger: "kickoff", at: 1002 }] as MarketCommand[]) {
      const n = await j.append("m1", c);
      live = safeReduce(live, c);
      await j.maybeSnapshot("m1", live, n);
    }
    store._corruptSnapshotState("m1", (s) => ((s as { committed: number }).committed = 999_999)); // mutate state, not hash
    await expect(j.recover("m1")).rejects.toMatchObject({ name: "JournalError", code: "corrupt-snapshot" });
  });

  it("journal trimmed below the snapshot seq → hard error (gap), never silent", async () => {
    const store = new MemJournalStore<MarketCommand, MarketState>();
    const j = marketJournal(store, 1000); // no snapshot within these few commands
    let live = initialMarket("m1", "m1", 1000);
    const cmds: MarketCommand[] = [
      { trigger: "open", at: 1001 },
      { trigger: "kickoff", at: 1002 },
      { trigger: "pivot", at: 1003, reason: "goal" },
      { trigger: "reopen", at: 1004 },
    ];
    for (const c of cmds) {
      const n = await j.append("m1", c);
      live = safeReduce(live, c);
      await j.maybeSnapshot("m1", live, n);
    }
    store._dropEntries("m1", (e) => e.n === 1); // over-aggressive trim leaves a hole (0, _, 2, 3)
    await expect(marketJournal(store, 1000).recover("m1")).rejects.toMatchObject({ name: "JournalError", code: "gap" });
  });

  it("empty journal recovers to null (no crash)", async () => {
    const store = new MemJournalStore<MarketCommand, MarketState>();
    expect(await marketJournal(store).recover("never-seen")).toBeNull();
  });
});

describe("journal — Redis store (skips if redis is down)", () => {
  it("append/snapshot/recover round-trips across a fresh instance", async (ctx) => {
    const IORedis = (await import("ioredis")).default;
    const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null });
    try {
      await redis.connect();
      await redis.ping();
    } catch {
      await redis.quit().catch(() => redis.disconnect());
      return void ctx.skip?.();
    }
    const key = `test:mkt:${Date.now()}`;
    const store = new RedisJournalStore<MarketCommand, MarketState>(redis);
    const j = marketJournal(store, 1000);
    let live = initialMarket(key, key, 1000);
    for (const c of [{ trigger: "open", at: 1001 }, { trigger: "kickoff", at: 1002 }, { trigger: "pivot", at: 1003, reason: "goal" }] as MarketCommand[]) {
      const n = await j.append(key, c);
      live = safeReduce(live, c);
      await j.maybeSnapshot(key, live, n);
    }
    const rec = await marketJournal(store, 1000).recover(key); // fresh instance rebuilds purely from Redis
    expect(rec).not.toBeNull();
    expect(hashState(rec!.state)).toBe(hashState(live));
    await redis.del(`journal:${key}`, `journal:snap:${key}`);
    await redis.quit().catch(() => redis.disconnect());
  }, 15000);
});
