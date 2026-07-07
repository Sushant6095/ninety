import { describe, it, expect } from "vitest";
import { applyOrder, bankersRound, POSITION_CAP, type OrderInput, type Side } from "./order";

// independent closed-form LMSR (NOT amm.ts) to check the cost math to 1e-9
const C = (q: number[], b: number): number => b * Math.log(q.reduce((s, x) => s + Math.exp(x / b), 0));
const closedBuy = (q: number[], b: number, i: number, d: number): number => {
  const q2 = [...q];
  q2[i] += d;
  return C(q2, b) - C(q, b);
};

const base: OrderInput = { side: "buy", outcome: 0, size: 100, q: [0, 0, 0], b: 200, tradeable: true, balance: 1e12, position: 0, recentOrderTimes: [], now: 1000 };

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0xffffffff);
}

describe("order — LMSR cost math", () => {
  it("fill cost matches the closed-form LMSR to 1e-9 (fixed + random cases)", () => {
    const fixed = [
      { q: [0, 0, 0], b: 100, i: 0, s: 100 },
      { q: [300, 120, 90], b: 250, i: 1, s: 57 },
      { q: [10, 10, 10], b: 50, i: 2, s: 5 },
    ];
    const r = rng(9);
    for (let k = 0; k < 500; k++) {
      fixed.push({ q: [r() * 400, r() * 400, r() * 400], b: 20 + r() * 480, i: Math.floor(r() * 3), s: 1 + Math.floor(r() * 200) });
    }
    for (const { q, b, i, s } of fixed) {
      const res = applyOrder({ ...base, outcome: i, size: s, q, b });
      expect(res.ok).toBe(true);
      if (res.ok) expect(Math.abs(res.fill.cost - closedBuy(q, b, i, s))).toBeLessThan(1e-9);
    }
  });

  it("sell refund equals the buy cost for the same share delta (LMSR is path-independent)", () => {
    const q = [0, 0, 0];
    const buy = applyOrder({ ...base, size: 100, q });
    expect(buy.ok).toBe(true);
    if (!buy.ok) return;
    const sell = applyOrder({ ...base, side: "sell", size: 100, q: [100, 0, 0], position: 100 });
    expect(sell.ok).toBe(true);
    if (sell.ok) expect(sell.fill.cost).toBeCloseTo(buy.fill.cost, 9);
  });
});

describe("order — fee (banker's) is burned", () => {
  it("rounds half to even", () => {
    expect(bankersRound(1.5)).toBe(2);
    expect(bankersRound(2.5)).toBe(2);
    expect(bankersRound(0.5)).toBe(0);
    expect(bankersRound(3.5)).toBe(4);
    expect(bankersRound(1.4)).toBe(1);
    expect(bankersRound(1.6)).toBe(2);
  });

  it("a buy emits debit(cost+fee) + burn(fee) with a banker's-rounded 1% fee", () => {
    const r = applyOrder({ ...base, size: 100, q: [0, 0, 0], b: 200 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fill.fee).toBe(bankersRound(r.fill.cost * 0.01));
    expect(r.ledger).toEqual([
      { kind: "debit", amount: r.fill.cost + r.fill.fee },
      { kind: "burn", amount: r.fill.fee },
    ]);
  });

  it("a buy+sell round-trip reduces the balance by EXACTLY the burned fees (fee burn shrinks the supply)", () => {
    const b = 200;
    const B0 = 1e9;
    const buy = applyOrder({ ...base, size: 100, q: [0, 0, 0], b, balance: B0, position: 0 });
    expect(buy.ok).toBe(true);
    if (!buy.ok) return;
    const balAfterBuy = B0 - (buy.fill.cost + buy.fill.fee);
    const sell = applyOrder({ ...base, side: "sell", size: 100, q: [100, 0, 0], b, balance: balAfterBuy, position: 100 });
    expect(sell.ok).toBe(true);
    if (!sell.ok) return;
    const finalBal = balAfterBuy + (sell.fill.cost - sell.fill.fee);
    const burned = buy.fill.fee + sell.fill.fee;
    expect(B0 - finalBal).toBeCloseTo(burned, 9); // supply reduced by exactly the two burns
    expect(sell.ledger.find((l) => l.kind === "burn")!.amount).toBe(sell.fill.fee);
  });
});

describe("order — risk rejections (each unit-tested)", () => {
  it("INVALID_SIZE for 0 / negative / NaN / ±Infinity / fractional", () => {
    for (const size of [0, -5, NaN, Infinity, -Infinity, 3.5]) {
      expect(applyOrder({ ...base, size })).toMatchObject({ ok: false, code: "INVALID_SIZE" });
    }
  });

  it("INVALID_OUTCOME for an out-of-range / negative / fractional / NaN index (guards against NaN-bricking the AMM)", () => {
    for (const outcome of [3, 99, -1, 1.5, NaN]) {
      // q has length 3 → valid indices are 0,1,2. Any other index would poke a phantom slot → NaN/0 cost.
      expect(applyOrder({ ...base, outcome })).toMatchObject({ ok: false, code: "INVALID_OUTCOME" });
    }
    expect(applyOrder({ ...base, outcome: 2 }).ok).toBe(true); // last valid index still fills
  });

  it("MARKET_HALTED when the market is not tradeable", () => {
    expect(applyOrder({ ...base, tradeable: false })).toMatchObject({ ok: false, code: "MARKET_HALTED" });
  });

  it("RATE_LIMIT: the 5th order in a second passes, the 6th rejects; stale orders fall out of the window", () => {
    expect(applyOrder({ ...base, recentOrderTimes: [1000, 1000, 1000, 1000], now: 1000 }).ok).toBe(true); // 5th
    expect(applyOrder({ ...base, recentOrderTimes: [1000, 1000, 1000, 1000, 1000], now: 1000 })).toMatchObject({ ok: false, code: "RATE_LIMIT" }); // 6th
    expect(applyOrder({ ...base, recentOrderTimes: [500, 600, 700, 800, 900], now: 2000 }).ok).toBe(true); // all > 1s old → window empty
  });

  it("INSUFFICIENT_BALANCE respects the explicit 1e-9 epsilon policy", () => {
    const q = [0, 0, 0];
    const b = 200;
    const cost = closedBuy(q, b, 0, 100);
    const debit = cost + bankersRound(cost * 0.01);
    expect(applyOrder({ ...base, q, b, balance: debit }).ok).toBe(true); // exactly enough
    expect(applyOrder({ ...base, q, b, balance: debit - 1e-9 }).ok).toBe(true); // short by 1e-9 → tolerated, fills
    expect(applyOrder({ ...base, q, b, balance: debit - 1e-8 })).toMatchObject({ ok: false, code: "INSUFFICIENT_BALANCE" }); // short by 1e-8 → rejects
  });

  it("POSITION_CAP at |position ± size| > 5000 (boundary allowed)", () => {
    expect(applyOrder({ ...base, position: POSITION_CAP - 100, size: 100 }).ok).toBe(true); // → exactly 5000
    expect(applyOrder({ ...base, position: POSITION_CAP - 99, size: 100 })).toMatchObject({ ok: false, code: "POSITION_CAP" }); // → 5001
  });

  it("INSUFFICIENT_POSITION when selling more than held (no shorting)", () => {
    expect(applyOrder({ ...base, side: "sell", position: 50, size: 100 })).toMatchObject({ ok: false, code: "INSUFFICIENT_POSITION" });
    expect(applyOrder({ ...base, side: "sell", position: 100, size: 100, q: [100, 0, 0] }).ok).toBe(true);
  });
});

describe("order — b changes between quote and fill (server price wins, client reconciles)", () => {
  it("fills at the SERVER b, not a client quote; a slippage limit rejects instead", () => {
    const q = [0, 0, 0];
    const cheap = applyOrder({ ...base, q, b: 400 }); // deeper liquidity → cheaper
    const dear = applyOrder({ ...base, q, b: 100 }); // server b moved down → dearer
    expect(cheap.ok && dear.ok).toBe(true);
    if (!cheap.ok || !dear.ok) return;
    expect(dear.fill.cost).toBeGreaterThan(cheap.fill.cost); // the fill used the live server b
    const clientLimit = cheap.fill.cost + cheap.fill.fee; // client quoted against b=400
    expect(applyOrder({ ...base, q, b: 100, limit: clientLimit })).toMatchObject({ ok: false, code: "SLIPPAGE" });
  });
});
