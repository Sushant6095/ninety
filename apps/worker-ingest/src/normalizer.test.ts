// VERIFY: action records → match.actions envelopes (stable seq, team resolution, Data passthrough);
// game phases 15/16/19 → ONE ft envelope whose status matches the engine's /aband/i abandon mapping
// (market.ts fromEnvelope) so the market lands in VOIDED with the committed-credit refund (ADR-059/024).
import { describe, it, expect } from "vitest";
import type { ScoreState } from "@omnipitch/txline";
import { normalizeAction, normalizeScore, voidPhase, SRC_ACTION, SRC_SCORE } from "./normalizer";

const base: ScoreState = {
  FixtureId: 18193785,
  GameState: "1h",
  Seq: 888,
  Ts: 1752570000,
  StatusId: 4,
  Participant1IsHome: true,
  Clock: { Running: true, Seconds: 1860 },
  Score: { Participant1: { Total: { Goals: 0 } }, Participant2: { Total: { Goals: 0 } } },
};

describe("normalizeAction", () => {
  const shot = { ...base, Action: "shot", Participant: 2, Confirmed: true, Id: 793, Data: { Outcome: "OnTarget" } } as ScoreState;

  it("maps a shot to a match.actions envelope with team + detail passthrough", () => {
    const env = normalizeAction(shot);
    expect(env).not.toBeNull();
    expect(env!.type).toBe("action");
    expect(env!.source).toBe(SRC_ACTION);
    expect(env!.match_id).toBe("18193785");
    expect(env!.payload).toMatchObject({ action: "shot", team: "away", minute: 31, confirmed: true, detail: { Outcome: "OnTarget" } });
  });

  it("resolves the team from the Participant slot honoring Participant1IsHome", () => {
    const p1 = normalizeAction({ ...shot, Participant: 1 } as ScoreState);
    expect(p1!.payload.team).toBe("home");
    const flipped = normalizeAction({ ...shot, Participant: 1, Participant1IsHome: false } as ScoreState);
    expect(flipped!.payload.team).toBe("away");
    const noSlot = normalizeAction({ ...shot, Participant: undefined } as ScoreState);
    expect(noSlot!.payload.team).toBeUndefined();
  });

  it("is deterministic per record (dedup key) and distinct across records", () => {
    expect(normalizeAction(shot)!.source_seq).toBe(normalizeAction(shot)!.source_seq);
    expect(normalizeAction({ ...shot, Id: 794 } as ScoreState)!.source_seq).not.toBe(normalizeAction(shot)!.source_seq);
  });

  it("drops feed noise and non-actions", () => {
    expect(normalizeAction({ ...base, Action: "attack_possession" } as ScoreState)).toBeNull();
    expect(normalizeAction({ ...base, Action: "action_amend" } as ScoreState)).toBeNull();
    expect(normalizeAction(base)).toBeNull();
  });
});

describe("game-phase → VOID (ADR-059)", () => {
  it.each([
    [15, "abandoned"],
    [16, "cancelled"],
    [19, "postponed"],
  ])("phase code %i (%s) emits one abandon-matching ft on the transition", (code, name) => {
    const cur = { ...base, StatusId: code, Seq: 889 } as ScoreState;
    const out = normalizeScore(cur, base);
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("ft");
    expect(out[0].source).toBe(SRC_SCORE);
    // the engine contract: fromEnvelope maps an ft whose status matches /aband/i to the abandon trigger
    expect(String(out[0].payload.status)).toMatch(/aband/i);
    expect(String(out[0].payload.status)).toContain(name);
  });

  it("matches numeric GameState codes and phase-name strings too", () => {
    expect(voidPhase({ ...base, GameState: 16 } as ScoreState)).toBe("cancelled");
    expect(voidPhase({ ...base, GameState: "Postponed" } as ScoreState)).toBe("postponed");
    expect(voidPhase(base)).toBeUndefined();
  });

  it("fires only on the transition, with a deterministic per-match seq", () => {
    const cur = { ...base, StatusId: 15, Seq: 889 } as ScoreState;
    const again = { ...base, StatusId: 15, Seq: 890 } as ScoreState;
    expect(normalizeScore(again, cur)).toHaveLength(0); // already void — no re-emit
    const a = normalizeScore(cur, base)[0];
    const b = normalizeScore(cur, base)[0];
    expect(a.source_seq).toBe(b.source_seq); // recovery snapshot re-derivation dedupes on (source, seq)
  });

  it("still derives goals alongside a void in the same delta", () => {
    const cur = {
      ...base,
      StatusId: 15,
      Seq: 889,
      Score: { Participant1: { Total: { Goals: 1 } }, Participant2: { Total: { Goals: 0 } } },
    } as ScoreState;
    const out = normalizeScore(cur, base);
    expect(out.map((e) => e.type)).toEqual(["goal", "ft"]);
  });
});
