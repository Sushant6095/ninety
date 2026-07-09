import { describe, it, expect } from "vitest";
import { planMark } from "./markets-read";
import type { Envelope } from "@omnipitch/schema";

const env = (payload: unknown, ts_ingest = "2026-07-09T12:00:00.000Z"): Envelope => ({
  event_id: "e", source: "cortex", source_seq: 1, match_id: "m1", market_id: "m1:1x2",
  ts_source: "2026-07-09T11:59:59.000Z", ts_ingest, type: "mark", payload: payload as Record<string, unknown>,
});

describe("planMark", () => {
  it("maps a real prices.marks envelope to the hash fields", () => {
    const plan = planMark(env({ market_id: "m1:1x2", fair: { H: 0.61, D: 0.22, A: 0.17 }, hazard: 0.4, b_hint: 420 }));
    expect(plan).not.toBeNull();
    expect(plan!.marketId).toBe("m1:1x2");
    expect(JSON.parse(plan!.fields.fair)).toEqual({ H: 0.61, D: 0.22, A: 0.17 });
    expect(plan!.fields.bHint).toBe("420");
    expect(plan!.fields.matchId).toBe("m1");
    expect(plan!.fields.ts).toBe(String(Date.parse("2026-07-09T12:00:00.000Z")));
  });

  it("returns null when market_id or fair is missing", () => {
    expect(planMark(env({ fair: { H: 1 } }))).toBeNull(); // no market_id
    expect(planMark(env({ market_id: "m1:1x2" }))).toBeNull(); // no fair
  });

  it("falls back to ts_source, then 0, when ts_ingest is unparseable", () => {
    const plan = planMark(env({ market_id: "x", fair: { H: 1 } }, "not-a-date"));
    expect(plan!.fields.ts).toBe(String(Date.parse("2026-07-09T11:59:59.000Z")));
  });
});
