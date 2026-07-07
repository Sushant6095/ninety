// Projection mapping (ADR-027): a bus Envelope → the durable rows + Redis hot-state deltas it implies. PURE and
// validated at the boundary (AnyEvent.safeParse) so a malformed event is skipped, never half-written. The store
// (projection-store.ts) applies a plan idempotently; this file only decides WHAT to write, never touches IO.
import { AnyEvent, type Envelope } from "@omnipitch/schema";

// Redis hot-state key scheme (colon convention, matching ws/channels.ts m:{id}:… and lb:global).
export const POS_KEY = (user: string, marketId: string, outcome: string): string => `pos:${user}:${marketId}:${outcome}`;
export const BAL_KEY = (user: string): string => `bal:${user}`;
export const LB_KEY = "lb:global"; // sorted set: member = user, score = net credit P&L
export const BURNED_KEY = "credits:burned"; // supply counter: total fees burned (ADR-026), NOT a user balance

export interface ProjectionPlan {
  order?: { id: string; userId: string; marketId: string; outcome: string; side: string; size: number; status: string };
  fill?: { orderId: string; price: number; size: number; fee: number };
  position?: { userId: string; marketId: string; outcome: string; qty: number; avgPrice: number };
  credit?: { userId: string; matchId: string; delta: number; reason: string };
  hot: {
    pos?: { key: string; qty: number }; // absolute SET (idempotent on re-consume)
    bal?: { user: string; delta: number }; // INCRBYFLOAT (once-only via the inbox gate)
    lb?: { user: string; delta: number }; // ZINCRBY lb:global — net credit P&L
    burned?: number; // INCRBYFLOAT credits:burned — fee removed from the SUPPLY (never a user balance)
  };
}

/** Map an Envelope to its projection plan, or null if it is not an event this projection persists. */
export function planProjection(env: Envelope): ProjectionPlan | null {
  const parsed = AnyEvent.safeParse(env);
  if (!parsed.success) return null; // unknown/malformed → skip (validated boundary)
  const e = parsed.data;
  const marketId = e.market_id ?? e.match_id;
  switch (e.type) {
    case "order":
      return {
        order: { id: e.payload.order_id ?? e.event_id, userId: e.payload.user_id, marketId, outcome: e.payload.outcome, side: e.payload.side, size: e.payload.size, status: e.payload.status ?? "filled" },
        hot: {},
      };
    case "fill":
      return { fill: { orderId: e.payload.order_id ?? e.event_id, price: e.payload.price, size: e.payload.size, fee: e.payload.fee }, hot: {} };
    case "position": {
      if (e.payload.user_id === undefined || e.payload.outcome === undefined) return null; // engine always sets both
      const { user_id, outcome, qty, avg } = e.payload;
      return {
        position: { userId: user_id, marketId, outcome, qty, avgPrice: avg },
        hot: { pos: { key: POS_KEY(user_id, marketId, outcome), qty } }, // absolute post-trade qty
      };
    }
    case "credit": {
      const { user_id, kind, amount } = e.payload;
      // A burn is SUPPLY accounting, NOT a user-balance change — the burned fee is already inside the debit
      // (ADR-026 M1). Keeping burns OUT of CreditLedger makes SUM(CreditLedger.delta) per user == the user's
      // balance (the ADR-003 authority) and keeps bal:/lb: in agreement; burns accumulate in a supply counter.
      if (kind === "burn") return { hot: { burned: amount } };
      const delta = kind === "credit" ? amount : -amount; // credit (sell refund) adds; debit (buy cost+fee) removes
      return {
        credit: { userId: user_id, matchId: e.match_id, delta, reason: kind },
        hot: { bal: { user: user_id, delta }, lb: { user: user_id, delta } },
      };
    }
    default:
      return null; // lifecycle/settlement/mark/sys — not this consumer's concern
  }
}
