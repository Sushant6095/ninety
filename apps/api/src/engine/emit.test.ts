import { describe, it, expect } from "vitest";
import { AnyEvent, TOPICS } from "@omnipitch/schema";
import { effectsToEnvelopes, deterministicEventId } from "./emit";

const TS = "2026-07-08T00:00:00.000Z";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const buyEffects = [
  { type: "fill", user: "u1", outcome: 0, side: "buy", price: 0.5, size: 100, cost: 50, fee: 1 },
  { type: "position", user: "u1", outcome: 0, qty: 100 },
  { type: "ledger", user: "u1", kind: "debit", amount: 51 },
  { type: "ledger", user: "u1", kind: "burn", amount: 1 },
] as const;

describe("engine emit — effects → bus envelopes (ADR-027)", () => {
  it("fans a filled buy out to order+fill+position+credit×2 on the right topics, all schema-valid", () => {
    const out = effectsToEnvelopes("mkt", 7, buyEffects as never, TS, TS);
    expect(out.map((o) => o.topic)).toEqual([TOPICS.orders, TOPICS.fills, TOPICS.positions, TOPICS.credits, TOPICS.credits]);
    for (const { env } of out) expect(() => AnyEvent.parse(env)).not.toThrow(); // every published envelope is a valid typed event
    expect(out[0].env.payload).toMatchObject({ user_id: "u1", outcome: "H", side: "buy", size: 100, status: "filled", order_id: "mkt:7" });
    expect(out[2].env.payload).toMatchObject({ user_id: "u1", outcome: "H", qty: 100, avg: 0.5 }); // avg = the paired fill price
  });

  it("stamps a UNIQUE, DETERMINISTIC (replay-stable) event_id per envelope", () => {
    const a = effectsToEnvelopes("mkt", 7, buyEffects as never, TS, TS);
    const b = effectsToEnvelopes("mkt", 7, buyEffects as never, TS, TS);
    const ids = a.map((o) => o.env.event_id);
    expect(new Set(ids).size).toBe(a.length); // all distinct within a command
    expect(b.map((o) => o.env.event_id)).toEqual(ids); // same inputs → same ids → re-emit dedups downstream
    expect(ids.every((id) => UUID_RE.test(id))).toBe(true);
  });

  it("emits nothing for a reject and maps the outcome index to its 1X2 label", () => {
    expect(effectsToEnvelopes("m", 1, [{ type: "reject", user: "u", code: "MARKET_HALTED" }] as never, TS, TS)).toEqual([]);
    const out = effectsToEnvelopes("m", 2, [{ type: "fill", user: "u", outcome: 2, side: "sell", price: 1, size: 5, cost: 5, fee: 0 }] as never, TS, TS);
    expect(out[0].env.payload).toMatchObject({ outcome: "A", side: "sell" }); // index 2 → A
  });

  it("deterministicEventId is stable, collision-free per input, and a valid uuid", () => {
    expect(deterministicEventId("engine:m:1:0")).toBe(deterministicEventId("engine:m:1:0"));
    expect(deterministicEventId("engine:m:1:0")).not.toBe(deterministicEventId("engine:m:1:1"));
    expect(UUID_RE.test(deterministicEventId("x"))).toBe(true);
  });
});
