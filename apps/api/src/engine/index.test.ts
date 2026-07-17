import { describe, it, expect } from "vitest";
import { Engine, EngineLeaseError, type EngineCmd, type EngineMarket } from "./index";
import { MemJournalStore, type JournalStore } from "./journal";
import type { StaleAlert } from "./watchdog";

const store = () => new MemJournalStore<EngineCmd, EngineMarket>();
const okLock = { acquire: async () => true, release: async () => {} };
const mark = (at: number): EngineCmd => ({ kind: "mark", at, bHint: 300 });
const life = (trigger: string, at: number, extra: Record<string, unknown> = {}): EngineCmd =>
  ({ kind: "lifecycle", at, cmd: { trigger: trigger as never, at, ...extra } });
const order = (at: number, o: Partial<Extract<EngineCmd, { kind: "order" }>["order"]> = {}): EngineCmd =>
  ({ kind: "order", at, order: { user: "u1", side: "buy", outcome: 0, size: 100, balance: 1e9, recentOrderTimes: [], ...o } });
// Effect-collecting emit spy shared by the order + halt/reopen suites. Matches the widened emit(marketId, n, at, effects).
const collect = () => {
  const effects: Array<{ type: string; [k: string]: unknown }> = [];
  return { effects, emit: (_m: string, _n: number, _at: number, e: readonly { type: string }[]) => void effects.push(...(e as never[])) };
};

describe("engine loop — per-market serialization", () => {
  it("2 markets × 1k interleaved commands → per-market ordering is perfect", async () => {
    const applied: Record<string, number[]> = { mA: [], mB: [] };
    const engine = new Engine({ store: store(), emit: async () => {}, lock: okLock, onApplied: (m, c) => applied[m].push(c.at) });
    await engine.start();
    for (let i = 0; i < 1000; i++) {
      engine.submit("mA", "matchA", mark(i)); // at=i is the per-market sequence marker
      engine.submit("mB", "matchB", mark(i));
    }
    await engine.drain();
    const expected = Array.from({ length: 1000 }, (_, i) => i);
    expect(applied.mA).toEqual(expected); // strict arrival order, market A
    expect(applied.mB).toEqual(expected); // strict arrival order, market B
    expect(engine.metrics.processed).toBe(2000);
  });

  it("marks and lifecycle commands interleave for one market in strict arrival order", async () => {
    const applied: EngineCmd[] = [];
    const engine = new Engine({ store: store(), emit: async () => {}, lock: okLock, onApplied: (_m, c) => applied.push(c) });
    await engine.start();
    const seq: EngineCmd[] = [
      life("open", 1),
      mark(2),
      life("kickoff", 3),
      mark(4),
      life("pivot", 5, { reason: "goal" }),
      mark(6),
      life("reopen", 7),
      mark(8),
      life("ft", 9),
      life("settle", 10, { result: "H", sig: "s" }),
    ];
    for (const c of seq) engine.submit("mA", "matchA", c);
    await engine.drain();
    expect(applied).toEqual(seq); // exact arrival order across marks + lifecycle
    expect(engine.stateOf("mA")!.lifecycle.status).toBe("SETTLED");
  });
});

describe("engine loop — backpressure + lease", () => {
  it("caps queue depth with a typed BACKPRESSURE rejection + metric", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const engine = new Engine({ store: store(), emit: async () => await gate, lock: okLock, maxQueueDepth: 5 });
    await engine.start();
    const results = Array.from({ length: 20 }, (_, i) => engine.submit("mA", "matchA", mark(i)));
    const rejected = results.filter((r) => !r.accepted);
    expect(rejected.length).toBeGreaterThan(0);
    expect(rejected.every((r) => !r.accepted && r.reason === "BACKPRESSURE")).toBe(true);
    expect(engine.metrics.backpressureRejects).toBe(rejected.length);
    release();
    await engine.drain();
  });

  it("a second engine process exits loudly when the lease is held", async () => {
    const engine = new Engine({ store: store(), emit: async () => {}, lock: { acquire: async () => false, release: async () => {} } });
    await expect(engine.start()).rejects.toBeInstanceOf(EngineLeaseError);
  });
});

describe("engine loop — recovery", () => {
  it("commands arriving during recovery are queued (not dropped) and applied in order after", async () => {
    const s = store();
    const e1 = new Engine({ store: s, emit: async () => {}, lock: okLock });
    await e1.start();
    e1.submit("mA", "matchA", life("open", 1));
    e1.submit("mA", "matchA", life("kickoff", 2));
    await e1.drain();

    const applied: number[] = [];
    const e2 = new Engine({ store: s, emit: async () => {}, lock: okLock, onApplied: (_m, c) => applied.push(c.at) });
    await e2.start();
    // submit IMMEDIATELY — the lane's recover is still pending, so these queue behind it
    e2.submit("mA", "matchA", life("pivot", 3, { reason: "goal" }));
    e2.submit("mA", "matchA", mark(4));
    e2.submit("mA", "matchA", life("reopen", 5));
    await e2.drain();
    expect(applied).toEqual([3, 4, 5]); // queued-during-recovery commands applied in arrival order, none dropped
    expect(e2.stateOf("mA")!.lifecycle.status).toBe("LIVE"); // recovered OPEN→LIVE, then pivot→halt→reopen→LIVE
  });

  it("a market whose recovery fails (corrupt snapshot) is quarantined — refuse to serve, alert", async () => {
    const s = store();
    const e1 = new Engine({ store: s, emit: async () => {}, lock: okLock, snapshotEvery: 2 });
    await e1.start();
    e1.submit("mA", "matchA", life("open", 1));
    e1.submit("mA", "matchA", life("kickoff", 2)); // snapshot at n=1
    await e1.drain();
    s._corruptSnapshotState("mA", (st) => ((st as EngineMarket).bHint = -1)); // torn/corrupt snapshot

    const errors: unknown[] = [];
    const e2 = new Engine({ store: s, emit: async () => {}, lock: okLock, snapshotEvery: 2, onError: (_m, e) => errors.push(e) });
    await e2.start();
    e2.submit("mA", "matchA", life("pivot", 3, { reason: "goal" })); // arrives at a dead market → dropped safely
    await e2.drain();
    expect(e2.metrics.unserveable).toBe(1);
    expect(errors.some((e) => (e as Error).name === "JournalError")).toBe(true);
    expect(e2.stateOf("mA")).toBeUndefined(); // never served a wrong state
  });

  it("quarantines on ANY recovery failure (a transient store error, not just JournalError) — fail safe", async () => {
    const base = store();
    const e1 = new Engine({ store: base, emit: async () => {}, lock: okLock });
    await e1.start();
    e1.submit("mA", "matchA", life("open", 1));
    await e1.drain(); // mA now has journal history
    // a store whose getSnapshot throws a transient, non-Journal error (e.g. Redis briefly unavailable)
    const flaky: JournalStore<EngineCmd, EngineMarket> = {
      append: (k, e) => base.append(k, e),
      entriesAfter: (k, n) => base.entriesAfter(k, n),
      putSnapshot: (k, s) => base.putSnapshot(k, s),
      getSnapshot: async () => {
        throw new Error("redis unavailable");
      },
      trimBelow: (k, n) => base.trimBelow(k, n),
    };
    const errors: unknown[] = [];
    const e2 = new Engine({ store: flaky, emit: async () => {}, lock: okLock, onError: (_m, e) => errors.push(e) });
    await e2.start();
    e2.submit("mA", "matchA", life("pivot", 2, { reason: "goal" })); // arrives at a market that will fail recovery
    await e2.drain();
    expect(e2.metrics.unserveable).toBe(1); // quarantined — NOT silently seeded fresh onto a wrong state
    expect(e2.stateOf("mA")).toBeUndefined();
    expect(errors.some((e) => e instanceof Error)).toBe(true); // alerted
  });
});

describe("engine loop — orders (ADR-026)", () => {
  it("fills an order: advances q, updates the position, emits fill/position/ledger effects", async () => {
    const { effects, emit } = collect();
    const engine = new Engine({ store: store(), emit, lock: okLock });
    await engine.start();
    engine.submit("mA", "matchA", life("open", 1));
    engine.submit("mA", "matchA", life("kickoff", 2)); // → LIVE (tradeable)
    engine.submit("mA", "matchA", order(3, { size: 100, outcome: 0 }));
    await engine.drain();
    const st = engine.stateOf("mA")!;
    expect(st.q[0]).toBe(100); // AMM shares advanced
    expect(st.positions["u1"]).toEqual([100, 0, 0]); // position booked
    expect(effects.find((e) => e.type === "fill")).toMatchObject({ user: "u1", size: 100, side: "buy" });
    expect(effects.find((e) => e.type === "position")).toMatchObject({ user: "u1", qty: 100 });
    expect(effects.filter((e) => e.type === "ledger").map((e) => e.kind)).toEqual(["debit", "burn"]);
  });

  it("submit().applied resolves with THIS command's effects — a fill for a valid order, a typed reject otherwise (ADR-071)", async () => {
    const engine = new Engine({ store: store(), emit: async () => {}, lock: okLock });
    await engine.start();
    engine.submit("mA", "matchA", life("open", 1));
    engine.submit("mA", "matchA", life("kickoff", 2)); // → LIVE (tradeable)
    const good = engine.submit("mA", "matchA", order(3, { user: "u1", size: 100, outcome: 0 }));
    expect(good.accepted).toBe(true);
    if (!good.accepted) return;
    expect((await good.applied).find((e) => e.type === "fill")).toMatchObject({ user: "u1", size: 100, side: "buy" });

    const bad = engine.submit("mA", "matchA", order(4, { user: "u2", size: 100, outcome: 0, balance: 0 })); // can't afford
    expect(bad.accepted).toBe(true);
    if (!bad.accepted) return;
    expect(await bad.applied).toEqual([{ type: "reject", user: "u2", code: "INSUFFICIENT_BALANCE" }]);
    await engine.drain();
  });

  it("emits a typed reject (no state change) for an order on a non-tradeable market", async () => {
    const { effects, emit } = collect();
    const engine = new Engine({ store: store(), emit, lock: okLock });
    await engine.start();
    engine.submit("mA", "matchA", order(1)); // first cmd → SCHEDULED, not tradeable
    await engine.drain();
    expect(effects).toEqual([{ type: "reject", user: "u1", code: "MARKET_HALTED" }]);
    expect(engine.stateOf("mA")!.q).toEqual([0, 0, 0]); // untouched
    expect(engine.stateOf("mA")!.positions).toEqual({});
  });

  it("replays orders deterministically — recovered q + positions match the live engine", async () => {
    const s = store();
    const e1 = new Engine({ store: s, emit: () => {}, lock: okLock });
    await e1.start();
    e1.submit("mA", "matchA", life("open", 1));
    e1.submit("mA", "matchA", life("kickoff", 2));
    e1.submit("mA", "matchA", order(3, { user: "u1", outcome: 0, size: 100 }));
    e1.submit("mA", "matchA", order(4, { user: "u2", outcome: 1, size: 50 }));
    await e1.drain();
    const live = e1.stateOf("mA")!;

    const e2 = new Engine({ store: s, emit: () => {}, lock: okLock });
    await e2.start();
    e2.submit("mA", "matchA", mark(5)); // forces lane creation + full journal replay of the two orders
    await e2.drain();
    expect(e2.stateOf("mA")!.q).toEqual(live.q); // q rebuilt purely from the journal
    expect(e2.stateOf("mA")!.positions).toEqual(live.positions);
  });

  it("rebuilds q + positions from a SNAPSHOT (snapshotEvery:1), not only the command stream", async () => {
    const s = store();
    const e1 = new Engine({ store: s, emit: () => {}, lock: okLock, snapshotEvery: 1 });
    await e1.start();
    e1.submit("mA", "matchA", life("open", 1));
    e1.submit("mA", "matchA", life("kickoff", 2));
    e1.submit("mA", "matchA", order(3, { user: "u1", outcome: 0, size: 100 }));
    e1.submit("mA", "matchA", order(4, { user: "u2", outcome: 2, size: 40 }));
    await e1.drain();
    const live = e1.stateOf("mA")!;

    const e2 = new Engine({ store: s, emit: () => {}, lock: okLock, snapshotEvery: 1 });
    await e2.start();
    e2.submit("mA", "matchA", mark(5)); // recovery loads the snapshot (written after every command) → not a from-zero replay
    await e2.drain();
    expect(e2.stateOf("mA")!.q).toEqual(live.q); // q survived the snapshot round-trip
    expect(e2.stateOf("mA")!.positions).toEqual(live.positions);
  });

  it("thins b through the ADR-005 reopen decay: a fill right after a goal-halt reopen costs more than at plain LIVE", async () => {
    const dear = collect();
    const tight = collect();
    const eDear = new Engine({ store: store(), emit: dear.emit, lock: okLock });
    const eTight = new Engine({ store: store(), emit: tight.emit, lock: okLock });
    await eDear.start();
    await eTight.start();
    // dear market: goal-halt then reopen → spreadAt = full 3× right at reopenAt
    eDear.submit("mD", "matchD", life("open", 1));
    eDear.submit("mD", "matchD", life("kickoff", 2));
    eDear.submit("mD", "matchD", life("pivot", 3, { reason: "goal" }));
    eDear.submit("mD", "matchD", life("reopen", 5));
    eDear.submit("mD", "matchD", order(5, { size: 100 })); // at === reopenAt → 3× spread → thinner b
    // tight market: plain LIVE → spreadAt = 1×
    eTight.submit("mT", "matchT", life("open", 1));
    eTight.submit("mT", "matchT", life("kickoff", 2));
    eTight.submit("mT", "matchT", order(5, { size: 100 }));
    await eDear.drain();
    await eTight.drain();
    const dearCost = dear.effects.find((e) => e.type === "fill")!.cost as number;
    const tightCost = tight.effects.find((e) => e.type === "fill")!.cost as number;
    expect(dearCost).toBeGreaterThan(tightCost); // reopen decay widened the spread → thinner b → dearer fill
  });
});

describe("engine loop — halt/reopen hardening (ADR-028)", () => {
  it("halts within one loop tick, well under the 300ms wall budget (measure)", async () => {
    const { effects, emit } = collect();
    const engine = new Engine({ store: store(), emit, lock: okLock });
    await engine.start();
    engine.submit("mA", "matchA", life("open", 1));
    engine.submit("mA", "matchA", life("kickoff", 2));
    await engine.drain();
    const t0 = performance.now();
    engine.submit("mA", "matchA", life("pivot", 3, { reason: "goal" }));
    await engine.drain();
    const elapsedMs = performance.now() - t0;
    expect(effects.some((e) => e.type === "halt")).toBe(true); // the halt landed on that tick
    expect(elapsedMs).toBeLessThan(300); // one loop tick ≪ 300ms budget
  });

  it("rejects every order in the halt window — zero fills between goal and reopen (VERIFY)", async () => {
    const { effects, emit } = collect();
    const engine = new Engine({ store: store(), emit, lock: okLock });
    await engine.start();
    engine.submit("mA", "matchA", life("open", 1));
    engine.submit("mA", "matchA", life("kickoff", 2));
    engine.submit("mA", "matchA", order(3, { user: "u1", size: 100 })); // fills while LIVE
    engine.submit("mA", "matchA", life("pivot", 4, { reason: "goal" })); // → HALTED
    for (let i = 0; i < 5; i++) engine.submit("mA", "matchA", order(5 + i, { user: `u${i}`, size: 50 })); // all mid-halt
    await engine.drain();
    expect(effects.filter((e) => e.type === "fill")).toHaveLength(1); // only the pre-goal fill
    expect(effects.filter((e) => e.type === "reject" && e.code === "MARKET_HALTED")).toHaveLength(5); // halt window rejects all
  });

  it("auto-reopens on the next mark after the 10s halt window; a mark inside the window stays halted", async () => {
    const { effects, emit } = collect();
    const engine = new Engine({ store: store(), emit, lock: okLock });
    await engine.start();
    engine.submit("mA", "matchA", life("open", 1));
    engine.submit("mA", "matchA", life("kickoff", 2));
    engine.submit("mA", "matchA", life("pivot", 3, { reason: "goal" })); // HALTED, haltedAt=3
    engine.submit("mA", "matchA", mark(5)); // 2s in → below the 10s window → anchor updates, stays HALTED
    await engine.drain();
    expect(engine.stateOf("mA")!.lifecycle.status).toBe("HALTED");
    engine.submit("mA", "matchA", mark(20_000)); // >10s since halt → auto-reopen on this mark
    await engine.drain();
    expect(engine.stateOf("mA")!.lifecycle.status).toBe("LIVE");
    expect(engine.stateOf("mA")!.lifecycle.reopenAt).toBe(20_000);
    expect(effects.some((e) => e.type === "reopen")).toBe(true); // reopen effect emitted
  });

  it("reopen cost curve decays monotonically as the spread relaxes 3×→1× (VERIFY)", async () => {
    const costAtElapsed = async (elapsedMs: number): Promise<number> => {
      const { effects, emit } = collect();
      const e = new Engine({ store: store(), emit, lock: okLock });
      await e.start();
      e.submit("m", "match", life("open", 1));
      e.submit("m", "match", life("kickoff", 2));
      e.submit("m", "match", life("pivot", 3, { reason: "goal" }));
      e.submit("m", "match", mark(20_000)); // auto-reopen → reopenAt = 20000, spread = 1× (mark hazard)
      e.submit("m", "match", order(20_000 + elapsedMs, { size: 100 })); // fresh market each time → only the spread differs
      await e.drain();
      return e.stateOf("m") ? (effects.find((x) => x.type === "fill")!.cost as number) : NaN;
    };
    const c0 = await costAtElapsed(0); // full 3× spread → thinnest b → dearest
    const c30 = await costAtElapsed(30_000); // half decayed
    const c60 = await costAtElapsed(60_000); // fully relaxed (1×) → cheapest
    expect(c0).toBeGreaterThan(c30);
    expect(c30).toBeGreaterThan(c60); // strictly monotonic decrease as the spread relaxes
  });

  it("same-ts resolution is bus-ARRIVAL order (replay-deterministic), NOT reducer event-time precedence", async () => {
    // goal ARRIVES before the order (both event-time ts=5): the order sees HALTED and rejects.
    const a = collect();
    const eA = new Engine({ store: store(), emit: a.emit, lock: okLock });
    await eA.start();
    eA.submit("mA", "matchA", life("open", 1));
    eA.submit("mA", "matchA", life("kickoff", 2));
    eA.submit("mA", "matchA", life("pivot", 5, { reason: "goal" }));
    eA.submit("mA", "matchA", order(5, { user: "u1", size: 100 }));
    await eA.drain();
    expect(a.effects.filter((e) => e.type === "fill")).toHaveLength(0);
    expect(a.effects.some((e) => e.type === "reject" && e.code === "MARKET_HALTED")).toBe(true);

    // order ARRIVES before the goal (both ts=5): it FILLS at pre-goal prices, then the goal halts. There is NO
    // reducer-level event-time tiebreak — resolution is arrival order. Replay stays deterministic (the journal
    // preserves arrival order); a cross-topic same-ts reorder buffer is a documented follow-up (it would fight the
    // ≤300ms one-tick halt). This test pins the residual behavior so the naming can't overstate a guarantee.
    const b = collect();
    const eB = new Engine({ store: store(), emit: b.emit, lock: okLock });
    await eB.start();
    eB.submit("mB", "matchB", life("open", 1));
    eB.submit("mB", "matchB", life("kickoff", 2));
    eB.submit("mB", "matchB", order(5, { user: "u1", size: 100 }));
    eB.submit("mB", "matchB", life("pivot", 5, { reason: "goal" }));
    await eB.drain();
    expect(b.effects.filter((e) => e.type === "fill")).toHaveLength(1); // filled — arrival order, no lookahead
    expect(b.effects.some((e) => e.type === "halt")).toBe(true);
  });

  it("stale-mark watchdog alerts a HALTED market whose feed goes stale, once, and re-arms on a fresh mark (ADR-028)", async () => {
    const alerts: StaleAlert[] = [];
    const engine = new Engine({ store: store(), emit: () => {}, lock: okLock, onStaleMark: (a) => alerts.push(a), staleMarkMs: 10_000, now: () => 0 });
    await engine.start();
    engine.submit("mA", "matchA", life("open", 1));
    engine.submit("mA", "matchA", life("kickoff", 2));
    engine.submit("mA", "matchA", mark(3)); // lastMarkAt = now() = 0
    engine.submit("mA", "matchA", life("pivot", 4, { reason: "goal" })); // → HALTED
    await engine.drain();
    expect(engine.checkStaleMarks(5_000)).toEqual([]); // 5s stale < threshold
    expect(engine.checkStaleMarks(20_000)).toEqual([{ marketId: "mA", staleMs: 20_000 }]); // >10s → alert once
    expect(engine.checkStaleMarks(30_000)).toEqual([]); // already alerted → silent
    expect(engine.metrics.staleMarkAlerts).toBe(1);
    expect(alerts).toEqual([{ marketId: "mA", staleMs: 20_000 }]);
  });
});
