import { describe, it, expect } from "vitest";
import type { Envelope } from "@omnipitch/schema";
import { MatchCard, type FixtureMeta } from "./matchcard";

const META: FixtureMeta = { home: { name: "Canada", code: "CAN" }, away: { name: "Morocco", code: "MAR" }, stage: "Round of 16" };
const env = (type: string, payload: Record<string, unknown>): Envelope =>
  ({ event_id: "e", source: "engine", source_seq: 1, match_id: "m1", ts_source: "", ts_ingest: "", type, payload }) as unknown as Envelope;
const mark = (fair: Record<string, number>): Envelope => env("mark", { market_id: "m1:win", fair });
const lb = { traders: 0, topSwing: 0 };

describe("MatchCard state machine", () => {
  it("walks kickoff → goal → red → halt → reopen → settled with the right immediate flags", () => {
    const c = new MatchCard("m1", META, 0);
    expect(c.applyEvent(env("kickoff", { status: "1H" }), 0).immediate).toBe(false);
    expect(c.state).toBe("live");

    expect(c.applyEvent(env("goal", { team: "home", minute: 38, score: { home: 1, away: 0 } }), 1000).immediate).toBe(true);
    expect(c.score).toEqual({ home: 1, away: 0 });
    expect(c.minute).toBe(38);

    expect(c.applyEvent(env("card", { color: "red", team: "away", minute: 40 }), 2000).immediate).toBe(true);
    expect(c.applyEvent(env("card", { color: "yellow", team: "away", minute: 41 }), 2500).immediate).toBe(false);

    expect(c.applyEvent(env("halt", { reason: "goal", spread_mult: 2 }), 3000).immediate).toBe(true);
    expect(c.state).toBe("halted");
    expect(c.applyEvent(env("reopen", { reason: "resolved", spread_mult: 1.5 }), 4000).immediate).toBe(true);
    expect(c.state).toBe("live");

    expect(c.applyEvent(env("settled", { result: "H", sig: "5xSig" }), 5000).immediate).toBe(true);
    expect(c.state).toBe("settled");
    const cs = c.toCardState(5000, lb);
    expect(cs.settled?.result).toBe("H");
    expect(cs.settled?.solscanUrl).toContain("5xSig");
  });

  it("orders 1X2 outcomes H/D/A with team codes and scales fair→price", () => {
    const c = new MatchCard("m1", META, 0);
    c.applyMark(mark({ H: 0.6, D: 0.25, A: 0.15 }), 0);
    const cs = c.toCardState(0, lb);
    expect(cs.rows.map((r) => r.label)).toEqual(["CAN", "DRW", "MAR"]);
    expect(cs.rows[0].price).toBe(60); // 0.6 × 100
    expect(cs.marketLabel).toBe("WIN MARKET (play credits)");
  });

  it("shows a sparkline cliff after a price jump (goal)", () => {
    const c = new MatchCard("m1", META, 0);
    for (let i = 0; i < 8; i++) c.applyMark(mark({ H: 0.4, D: 0.3, A: 0.3 }), i * 1000);
    for (let i = 8; i < 16; i++) c.applyMark(mark({ H: 0.7, D: 0.15, A: 0.15 }), i * 1000);
    const spark = c.toCardState(16000, lb).rows[0].spark;
    expect(spark[0]).toBe("▁");
    expect(spark[spark.length - 1]).toBe("█");
  });

  it("freezes the sparkline while halted, resumes on reopen", () => {
    const c = new MatchCard("m1", META, 0);
    for (let i = 0; i < 8; i++) c.applyMark(mark({ H: 0.4, D: 0.3, A: 0.3 }), i * 1000);
    c.applyEvent(env("halt", { reason: "g", spread_mult: 2 }), 8000);
    const frozen = c.toCardState(8000, lb).rows[0].spark;
    for (let i = 9; i < 20; i++) c.applyMark(mark({ H: 0.95, D: 0.03, A: 0.02 }), i * 1000); // wild moves during halt
    expect(c.toCardState(20000, lb).rows[0].spark).toBe(frozen); // frozen
    c.applyEvent(env("reopen", { reason: "r", spread_mult: 1 }), 21000);
    expect(c.toCardState(21000, lb).rows[0].spark).not.toBe(frozen); // resumed
  });

  it("bounds memory: a firehose of marks still renders a 16-wide sparkline", () => {
    const c = new MatchCard("m1", META, 0);
    for (let i = 0; i < 1000; i++) c.applyMark(mark({ H: 0.5 + 0.0001 * i, D: 0.3, A: 0.2 }), i * 100);
    expect(c.toCardState(100000, lb).rows[0].spark.length).toBe(16);
  });

  it("prunes marks older than the 15-min window", () => {
    const c = new MatchCard("m1", META, 0);
    c.applyMark(mark({ H: 0.4, D: 0.3, A: 0.3 }), 0);
    c.applyMark(mark({ H: 0.7, D: 0.15, A: 0.15 }), 16 * 60 * 1000); // 16 min later → the first point falls out
    expect(c.toCardState(16 * 60 * 1000, lb).rows[0].spark).toBe("▁"); // single surviving point, not "▁█"
  });

  it("ignores marks from a second market — the card is dedicated to one market", () => {
    const c = new MatchCard("m1", META, 0);
    c.applyMark(mark({ H: 0.6, D: 0.25, A: 0.15 }), 0);
    c.applyMark(env("mark", { market_id: "m1:ou", fair: { OVER: 0.7, UNDER: 0.3 } }), 1000);
    expect(c.toCardState(1000, lb).rows.map((r) => r.label)).toEqual(["CAN", "DRW", "MAR"]); // still the win market
  });
});
