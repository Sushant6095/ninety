import { describe, it, expect } from "vitest";
import { AnyEvent, parseEvent, safeParseEvent, parsePayload, PAYLOAD_BY_TYPE } from "./events";
import { EventType, Envelope } from "./envelope";

const base = {
  event_id: "11111111-1111-4111-8111-111111111111",
  source: "engine",
  source_seq: 1,
  match_id: "wc26-bra-arg",
  market_id: "wc26-bra-arg:1x2",
  ts_source: "2026-07-07T20:00:00.000Z",
  ts_ingest: "2026-07-07T20:00:00.050Z",
} as const;

// One valid payload per Envelope.type — the round-trip corpus (real WC26-shaped data).
const payloadByType: Record<string, unknown> = {
  odds_tick: { outcomes: { H: 2.1, D: 3.4, A: 3.2 } },
  goal: { team: "home", minute: 23, score: { home: 1, away: 0 } },
  card: { color: "yellow", team: "away", minute: 40 },
  penalty: { team: "home", minute: 55, outcome: "awarded" },
  kickoff: { status: "1H" },
  ht: { status: "HT" },
  ft: { status: "FT" },
  order: { order_id: "o1", user_id: "u1", outcome: "H", side: "buy", size: 10, status: "accepted" },
  fill: { order_id: "o1", price: 0.61, size: 10, fee: 0.5 },
  position: { user_id: "u1", outcome: "H", qty: 10, avg: 0.6 },
  halt: { reason: "goal", spread_mult: 2 },
  reopen: { reason: "resolved", spread_mult: 1.5 },
  mark: { market_id: "wc26-bra-arg:1x2", fair: { H: 0.6, D: 0.25, A: 0.15 }, hazard: 0.02, b_hint: 300 },
  commentary: { text: "GOAL! Brazil strikes first.", voice: "booth-1" },
  settled: { result: "H", sig: "5xSettlementSig111" },
};

const sampleFor = (type: string) => ({ ...base, type, payload: payloadByType[type] });

describe("event contract", () => {
  it("covers every Envelope.type with a payload schema, a sample, and a union variant", () => {
    for (const t of EventType.options) {
      expect(PAYLOAD_BY_TYPE, `PAYLOAD_BY_TYPE missing ${t}`).toHaveProperty(t);
      expect(payloadByType, `sample missing ${t}`).toHaveProperty(t);
    }
    // discriminated union is exhaustive over the type enum — no forgotten variant
    expect(AnyEvent.options.length).toBe(EventType.options.length);
  });

  it("round-trips every event type through AnyEvent without loss", () => {
    for (const t of EventType.options) {
      const sample = sampleFor(t);
      const parsed = parseEvent(sample);
      expect(parsed).toEqual(sample); // nothing dropped or injected
      expect(parsed.type).toBe(t); // discriminator preserved
      expect(parsePayload(t, sample.payload)).toEqual(sample.payload); // registry agrees
    }
  });

  it("narrows the payload type on the discriminant", () => {
    const e = parseEvent(sampleFor("goal"));
    if (e.type !== "goal") throw new Error("expected goal");
    expect(e.payload.team).toBe("home"); // typed access, no cast
    expect(e.payload.score.home).toBe(1);
  });

  it("rejects a payload that violates its type's schema", () => {
    const bad = { ...base, type: "odds_tick", payload: { outcomes: { H: 2.1, D: 3.4 } } }; // A missing
    expect(safeParseEvent(bad).success).toBe(false);
    expect(() => parsePayload("odds_tick", bad.payload)).toThrow();
  });

  it("rejects an unknown event type", () => {
    const bad = { ...base, type: "nope", payload: {} };
    expect(() => parseEvent(bad)).toThrow();
    expect(safeParseEvent(bad).success).toBe(false);
  });

  it("rejects a malformed envelope base field", () => {
    const bad = { ...sampleFor("kickoff"), event_id: "not-a-uuid" };
    expect(safeParseEvent(bad).success).toBe(false);
  });

  it("keeps the loose Envelope accepting any well-formed event (bus transport)", () => {
    const parsed = Envelope.parse(sampleFor("mark"));
    expect(parsed.type).toBe("mark");
  });
});
