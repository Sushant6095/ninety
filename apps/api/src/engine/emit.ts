// Pure mapper: engine effects → bus Envelopes (ADR-027). The engine only EMITS; a projection service consumes.
// This stays a pure function (no bus, no clock) so it is unit-testable; the startEngine adapter supplies the
// timestamps and does the bus.publish. Deterministic event_ids make the whole pipeline idempotent on re-emit.
import { createHash } from "node:crypto";
import { TOPICS, type Envelope, type EventType, type Topic } from "@omnipitch/schema";
import type { EngineEffect } from "./index";

const OUTCOMES = ["H", "D", "A"] as const; // engine numeric outcome index → 1X2 label (ADR-001)

// Deterministic uuid (v5-style) from a name — no dependency. Same (marketId, n, k) always yields the same uuid,
// so a re-emit of the same effect carries the same event_id and the projection inbox dedups it. Formats 32 hex
// chars as 8-4-4-4-12 with the version (5) and variant (10xx) nibbles set so it satisfies z.string().uuid().
export function deterministicEventId(name: string): string {
  const h = createHash("sha256").update(name).digest("hex").slice(0, 32);
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Map one command's effects (with its journal seq `n` and event-time `at`) to the Envelopes to publish. A fill
 * fans out to an order row (status "filled") + a fill row joined by a deterministic order_id; a position → a
 * position event (avg = the paired fill's price, a v1 approximation — the engine tracks qty, not cost basis);
 * a ledger effect → a credit event; a settled lifecycle effect → the settlement topic. reject + other lifecycle
 * effects (halt/reopen/…) are not projected here (order-source gateway / lifecycle-topic routing are follow-ups).
 */
export function effectsToEnvelopes(
  marketId: string,
  n: number,
  effects: readonly EngineEffect[],
  tsSource: string,
  tsIngest: string,
): Array<{ topic: Topic; env: Envelope }> {
  const out: Array<{ topic: Topic; env: Envelope }> = [];
  const orderId = `${marketId}:${n}`; // one order command → one order; joins order ↔ fill ↔ position
  let k = 0; // running index of PUBLISHED envelopes → unique deterministic event_id per envelope
  let lastFillPrice = 0; // the position effect follows its fill in the effects array (applyOrderCmd emit order)

  const env = (type: EventType, payload: Record<string, unknown>): Envelope => ({
    event_id: deterministicEventId(`engine:${marketId}:${n}:${k++}`),
    source: "engine",
    source_seq: n, // per-market monotone; dedup is by event_id (deterministic), source_seq gives ordering
    match_id: marketId,
    market_id: marketId, // v1: one 1X2 market per match → marketId === matchId
    ts_source: tsSource,
    ts_ingest: tsIngest,
    type,
    payload,
  });

  for (const e of effects) {
    if (e.type === "fill") {
      lastFillPrice = e.price;
      out.push({ topic: TOPICS.orders, env: env("order", { order_id: orderId, user_id: e.user, outcome: OUTCOMES[e.outcome], side: e.side, size: e.size, status: "filled" }) });
      out.push({ topic: TOPICS.fills, env: env("fill", { order_id: orderId, price: e.price, size: e.size, fee: e.fee }) });
    } else if (e.type === "position") {
      out.push({ topic: TOPICS.positions, env: env("position", { user_id: e.user, outcome: OUTCOMES[e.outcome], qty: e.qty, avg: lastFillPrice }) });
    } else if (e.type === "ledger") {
      out.push({ topic: TOPICS.credits, env: env("credit", { user_id: e.user, kind: e.kind, amount: e.amount }) });
    } else if (e.type === "settled") {
      out.push({ topic: TOPICS.settlement, env: env("settled", { result: e.result, sig: e.sig }) });
    }
  }
  return out;
}
