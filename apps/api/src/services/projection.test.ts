import { describe, it, expect } from "vitest";
import type { Envelope } from "@omnipitch/schema";
import { Engine, type EngineCmd, type EngineMarket } from "../engine/index";
import { MemJournalStore } from "../engine/journal";
import { effectsToEnvelopes, deterministicEventId } from "../engine/emit";
import { planProjection, POS_KEY } from "./projection";
import { MemProjectionStore } from "./projection-store";

const okLock = { acquire: async () => true, release: async () => {} };
const OUTCOMES = ["H", "D", "A"];

// Run N scripted orders through a REAL engine, collecting the bus envelopes it emits (via the pure emit mapper).
async function scriptOrders(n: number): Promise<{ engine: Engine; envelopes: Envelope[] }> {
  const envelopes: Envelope[] = [];
  const engine = new Engine({
    store: new MemJournalStore<EngineCmd, EngineMarket>(),
    lock: okLock,
    emit: (marketId, seq, at, effects) => {
      const ts = new Date(at).toISOString();
      for (const { env } of effectsToEnvelopes(marketId, seq, effects, ts, ts)) envelopes.push(env);
    },
  });
  await engine.start();
  engine.submit("m", "match", { kind: "lifecycle", at: 1, cmd: { trigger: "open", at: 1 } });
  engine.submit("m", "match", { kind: "lifecycle", at: 2, cmd: { trigger: "kickoff", at: 2 } });
  for (let i = 0; i < n; i++) {
    engine.submit("m", "match", { kind: "order", at: 3 + i, order: { user: `u${i % 5}`, side: "buy", outcome: i % 3, size: 10 + (i % 7), balance: 1e12, recentOrderTimes: [] } });
  }
  await engine.drain();
  return { engine, envelopes };
}

const project = async (store: MemProjectionStore, envelopes: Envelope[]): Promise<void> => {
  for (const env of envelopes) {
    const plan = planProjection(env);
    if (plan) await store.apply(env.event_id, env.type, plan);
  }
};

describe("projection — VERIFY (ADR-027)", () => {
  it("replay + 50 scripted orders → projected position rows EQUAL the engine's positions (DB == engine state)", async () => {
    const { engine, envelopes } = await scriptOrders(50);
    const store = new MemProjectionStore();
    await project(store, envelopes);

    const eng = engine.stateOf("m")!;
    let compared = 0;
    for (const [user, pos] of Object.entries(eng.positions)) {
      for (let o = 0; o < 3; o++) {
        const row = store.positions.get(`${user}|m|${OUTCOMES[o]}`);
        expect(row?.qty ?? 0).toBe(pos[o]); // Postgres Position.qty == engine position
        expect(store.hot.pos.get(POS_KEY(user, "m", OUTCOMES[o])) ?? 0).toBe(pos[o]); // Redis pos: hot state agrees
        if (pos[o] !== 0) compared++;
      }
    }
    expect(compared).toBeGreaterThan(0); // sanity: real non-zero positions were actually compared
    expect(store.fills).toHaveLength(50); // one fill row per accepted order

    // ADR-003 authority invariant: Σ(CreditLedger.delta) per user == the Redis bal: hot value (burns don't drift it)
    const balByUser = new Map<string, number>();
    for (const c of store.credits) balByUser.set(c.userId, (balByUser.get(c.userId) ?? 0) + c.delta);
    for (const [user, bal] of balByUser) expect(store.hot.bal.get(user) ?? 0).toBeCloseTo(bal, 9);
  });

  it("re-consuming the SAME events writes ZERO duplicate rows (idempotent by event_id)", async () => {
    const { envelopes } = await scriptOrders(50);
    const store = new MemProjectionStore();
    await project(store, envelopes);
    const snap = () => ({ orders: store.orders.length, fills: store.fills.length, positions: store.positions.size, credits: store.credits.length, processed: store.processed.size });
    const before = snap();
    await project(store, envelopes); // exact re-consume of every event
    expect(snap()).toEqual(before); // nothing new written
    expect(before.processed).toBe(envelopes.length); // every event was recorded in the inbox
  });

  it("credit-ledger delta is signed; a burn is SUPPLY-only, excluded from the user ledger and bal/lb (ADR-026 M1)", () => {
    const credit = (kind: string, amount: number): Envelope =>
      ({ event_id: deterministicEventId(`${kind}-${amount}`), source: "engine", source_seq: 1, match_id: "m", market_id: "m", ts_source: "2026-07-08T00:00:00.000Z", ts_ingest: "2026-07-08T00:00:00.000Z", type: "credit", payload: { user_id: "u1", kind, amount } }) as unknown as Envelope;
    const debit = planProjection(credit("debit", 51))!;
    const burn = planProjection(credit("burn", 1))!;
    const refund = planProjection(credit("credit", 40))!;
    expect(debit.credit!.delta).toBe(-51);
    expect(debit.hot.bal!.delta).toBe(-51); // debit moves balance
    expect(burn.credit).toBeUndefined(); // burn is NOT a user-ledger row → keeps Σ(delta) == balance
    expect(burn.hot.bal).toBeUndefined(); // NOT a second balance deduction (fee already inside the debit)
    expect(burn.hot.burned).toBe(1); // tracked as SUPPLY instead
    expect(refund.hot.bal!.delta).toBe(40); // sell refund adds credits
  });
});
