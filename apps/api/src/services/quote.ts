// Advisory trade quote (ADR-046). The exact LMSR q lives only in the engine; here we reconstruct a MARK-IMPLIED
// q = b·ln(fair) (recentred) from the read model's live mark + b, then reuse the PURE engine amm math to preview
// cost/avgPx. Advisory only — server price wins at fill (ADR-026). No engine state, no credits move.
import { buyCost, price } from "../engine/amm";

export const OUTCOMES = ["H", "D", "A"] as const;
export type Outcome = (typeof OUTCOMES)[number];
export type Side = "buy" | "sell";

const PAYOUT_PER_SHARE = 100; // a winning share settles to 100 credits; prices are displayed 0..100
const P_FLOOR = 1e-4; // keep ln(p) finite for a degenerate mark
const P_CEIL = 0.9999;

/** Reconstruct a mark-implied q from a fair distribution + b: q_i = b·ln(p_i). The additive constant cancels in
 *  LMSR price/cost, so no centring is needed; `price(markImpliedQ(fair,b), b, i)` reproduces `fair_i`. */
export function markImpliedQ(fair: Record<string, number>, b: number): number[] {
  return OUTCOMES.map((o) => b * Math.log(Math.min(P_CEIL, Math.max(P_FLOOR, fair[o] ?? 1 / OUTCOMES.length))));
}

export interface Quote {
  outcome: Outcome;
  side: Side;
  size: number;
  cost: number; // credits
  avgPx: number; // 0..100
  maxPayout: number; // credits
  spreadMult: number;
  markImplied: true; // advisory basis — see ADR-046
}

export function isOutcome(x: unknown): x is Outcome {
  return x === "H" || x === "D" || x === "A";
}

/** A mark is COMPLETE iff every 1X2 outcome (H/D/A) is present and finite. An incomplete mark — an over/under
 *  feed mark keyed {over,under}, a partial mark, or a low-confidence synthesis — must render UNPRICED, never a
 *  fabricated even book (ADR-071). Callers guard with this before markImpliedQ / before showing a price. */
export function hasCompleteFair(fair: Record<string, number> | null | undefined): fair is Record<string, number> {
  return !!fair && OUTCOMES.every((o) => typeof fair[o] === "number" && Number.isFinite(fair[o]));
}

/** Preview a trade of `size` shares of `outcome`. Buys pay the spread multiplier on the marginal cost; sells give
 *  it back. Returns credits + avg price (0..100). Reuses the one LMSR impl (engine/amm.ts, ADR-002). */
export function quoteTrade(fair: Record<string, number>, b: number, outcome: Outcome, size: number, side: Side, spreadMult = 1): Quote {
  const i = OUTCOMES.indexOf(outcome);
  const q = markImpliedQ(fair, b);
  const safeSize = Math.max(0, size);
  const delta = side === "buy" ? safeSize : -safeSize;
  const raw = Math.abs(buyCost(q, b, i, delta)) * PAYOUT_PER_SHARE; // marginal cost in credits (buy) / refund (sell)
  const spread = side === "buy" ? spreadMult : 1 / spreadMult;
  const cost = raw * spread;
  return {
    outcome,
    side,
    size: safeSize,
    cost,
    avgPx: safeSize > 0 ? cost / safeSize : price(q, b, i) * PAYOUT_PER_SHARE,
    maxPayout: safeSize * PAYOUT_PER_SHARE,
    spreadMult,
    markImplied: true,
  };
}
