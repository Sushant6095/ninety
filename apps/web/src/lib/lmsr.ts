// Client-side LMSR (ADR-002) — a faithful port of apps/api/src/engine/amm.ts for the trade-quote PREVIEW.
// The backend GET /markets/:id/quote computes the same buyCost() on the engine-emitted amm snapshot (ADR-046,
// q + b + spread_mult); this mirrors it so the terminal previews cost/avgPx offline. Server price wins at fill.
const logSumExp = (xs: readonly number[]): { max: number; sumExp: number } => {
  let max = -Infinity;
  for (const x of xs) if (x > max) max = x;
  let sumExp = 0;
  for (const x of xs) sumExp += Math.exp(x - max);
  return { max, sumExp };
};

export const cost = (q: number[], b: number): number => {
  const { max, sumExp } = logSumExp(q.map((qi) => qi / b));
  return b * (max + Math.log(sumExp));
};

export const price = (q: number[], b: number, i: number): number => {
  const xs = q.map((qi) => qi / b);
  const { max, sumExp } = logSumExp(xs);
  return Math.exp(xs[i] - max) / sumExp;
};

export const buyCost = (q: number[], b: number, i: number, delta: number): number => {
  const q2 = [...q];
  q2[i] += delta;
  return cost(q2, b) - cost(q, b);
};

const PAYOUT_PER_SHARE = 100; // a winning share settles to 100 credits; prices display in 0..100

export interface Quote {
  cost: number; // credits
  avgPx: number; // 0..100
  maxPayout: number; // credits
  side: "buy" | "sell";
}

/** Preview a trade: `size` shares of outcome `i`, applying the spread multiplier to the marginal cost.
 *  Mirrors the backend quote endpoint. `size` ≥ 0; side "sell" reduces the position (refund). */
export function quote(q: number[], b: number, i: number, size: number, side: "buy" | "sell", spreadMult = 1): Quote {
  const safeSize = Math.max(0, size);
  const delta = side === "buy" ? safeSize : -safeSize;
  const raw = buyCost(q, b, i, delta) * PAYOUT_PER_SHARE; // credits (buy: +cost, sell: −refund)
  const spread = side === "buy" ? spreadMult : 1 / spreadMult; // buys pay the spread, sells give it back
  const costCredits = Math.abs(raw) * spread;
  return {
    cost: costCredits,
    avgPx: safeSize > 0 ? costCredits / safeSize : price(q, b, i) * PAYOUT_PER_SHARE,
    maxPayout: safeSize * PAYOUT_PER_SHARE,
    side,
  };
}
