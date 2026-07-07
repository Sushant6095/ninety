// Order command (ADR-026): risk gate → LMSR fill at LIVE b → 1% fee (burned) → position delta + credit-ledger
// events. Sell is symmetric. PURE + deterministic: given (side, size, live q/b, balance, position, the user's
// recent order times), it returns a typed fill or a typed rejection — no IO, no state ownership. The engine
// applies the deltas to its per-market AMM state and emits the ledger events; the ledger is the balance authority.
import { buyCost } from "./amm";

export const FEE_RATE = 0.01; // 1% fee, BURNED (removed from the credit supply)
export const POSITION_CAP = 5000; // |position| per outcome
export const RATE_LIMIT = 5; // max orders / second / user
export const RATE_WINDOW_MS = 1000;
// Balance-check float tolerance. LMSR cost is a float; a debit that exceeds balance by ≤ this is treated as
// float error and FILLS; beyond it, rejects. So "cost > balance by exactly 1e-9" fills; by more, rejects.
export const BALANCE_EPS = 1e-9;

export type Side = "buy" | "sell";
export type RejectCode =
  | "INVALID_SIZE" // size not a positive finite integer (0 / negative / NaN / Infinity / fractional)
  | "INVALID_OUTCOME" // outcome not an in-range integer index into q (guards against NaN-bricking the AMM)
  | "PRICE_UNAVAILABLE" // LMSR returned a non-finite cost (bad b / overflow) — reject, never journal a NaN fill
  | "MARKET_HALTED" // market not accepting orders (only OPEN/LIVE)
  | "RATE_LIMIT" // more than RATE_LIMIT orders in the trailing second for this user
  | "SLIPPAGE" // server price moved past the client's limit (server price wins; client reconciles)
  | "INSUFFICIENT_BALANCE" // buy: debit exceeds balance (beyond BALANCE_EPS)
  | "INSUFFICIENT_POSITION" // sell: position < size (no shorting)
  | "POSITION_CAP"; // |position ± size| > POSITION_CAP

export interface LedgerEvent {
  kind: "debit" | "credit" | "burn";
  amount: number;
}
export interface Fill {
  price: number; // per-share fill = cost / size
  size: number;
  cost: number; // LMSR credits moved (buy: paid to the AMM; sell: refunded from it)
  fee: number; // burned
}
export interface OrderInput {
  side: Side;
  outcome: number; // index into q
  size: number; // shares
  q: number[]; // AMM shares outstanding (LIVE — server state at fill time)
  b: number; // LIVE LMSR liquidity (the engine passes bHint/spread)
  tradeable: boolean; // canAcceptOrder(market)
  balance: number; // user's credit balance
  position: number; // user's current position in this (market, outcome)
  recentOrderTimes: number[]; // this user's recent accepted-order event-times
  now: number; // event-time of this order (from the payload — never a wall clock)
  limit?: number; // buy: max acceptable total debit; sell: min acceptable net credit (slippage guard)
}
export type OrderResult =
  | { ok: true; fill: Fill; positionDelta: number; shareDelta: number; ledger: LedgerEvent[] }
  | { ok: false; code: RejectCode };

/** Banker's rounding (round half to EVEN) to whole credits. Chosen for the burned fee so rounding drifts
 *  neither toward the user nor the house across many trades (floor/ceil would bias one way). */
export function bankersRound(x: number): number {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1; // exactly .5 → nearest even
}

const isPositiveInteger = (n: number): boolean => Number.isInteger(n) && n > 0;

export function applyOrder(input: OrderInput): OrderResult {
  const { side, outcome, size, q, b, tradeable, balance, position, recentOrderTimes, now, limit } = input;

  // Risk gate (fail fast; order is deterministic):
  if (!isPositiveInteger(size)) return { ok: false, code: "INVALID_SIZE" }; // 0 / negative / NaN / Infinity / fractional
  // outcome MUST be an in-range integer: an out-of-range/fractional index sets a phantom slot in q → buyCost
  // returns NaN (bricks the market forever) or 0 (free fill). This is a trust boundary — validate before amm math.
  if (!Number.isInteger(outcome) || outcome < 0 || outcome >= q.length) return { ok: false, code: "INVALID_OUTCOME" };
  if (!tradeable) return { ok: false, code: "MARKET_HALTED" };
  const inWindow = recentOrderTimes.filter((t) => now - t < RATE_WINDOW_MS).length;
  if (inWindow >= RATE_LIMIT) return { ok: false, code: "RATE_LIMIT" }; // 5th passes (4 prior), 6th rejects

  if (side === "buy") {
    const cost = buyCost(q, b, outcome, size); // LMSR marginal cost at LIVE b (server price wins)
    if (!Number.isFinite(cost)) return { ok: false, code: "PRICE_UNAVAILABLE" }; // never let a NaN/Inf cost reach the journal
    const fee = bankersRound(cost * FEE_RATE);
    const debit = cost + fee;
    if (limit !== undefined && debit > limit + BALANCE_EPS) return { ok: false, code: "SLIPPAGE" };
    if (debit - balance > BALANCE_EPS) return { ok: false, code: "INSUFFICIENT_BALANCE" };
    if (position + size > POSITION_CAP) return { ok: false, code: "POSITION_CAP" }; // position ≥ 0 (no shorting) → no abs

    return {
      ok: true,
      fill: { price: cost / size, size, cost, fee },
      positionDelta: size,
      shareDelta: size,
      ledger: [
        { kind: "debit", amount: debit }, // cost → AMM pot, fee → burned; total user credits drop by debit
        { kind: "burn", amount: fee },
      ],
    };
  }

  // sell (symmetric): no shorting — can't sell more than held.
  if (position < size) return { ok: false, code: "INSUFFICIENT_POSITION" };
  const refund = -buyCost(q, b, outcome, -size); // credits returned for removing `size` shares (≥ 0)
  if (!Number.isFinite(refund)) return { ok: false, code: "PRICE_UNAVAILABLE" }; // never journal a NaN/Inf sell
  const fee = bankersRound(refund * FEE_RATE);
  const net = refund - fee;
  if (limit !== undefined && net < limit - BALANCE_EPS) return { ok: false, code: "SLIPPAGE" };
  // no sell-side cap check: INSUFFICIENT_POSITION guarantees 0 ≤ position − size ≤ position ≤ CAP (can't exceed it).
  return {
    ok: true,
    fill: { price: refund / size, size, cost: refund, fee },
    positionDelta: -size,
    shareDelta: -size,
    ledger: [
      { kind: "credit", amount: net }, // AMM pot → user (refund − fee); fee burned
      { kind: "burn", amount: fee },
    ],
  };
}
