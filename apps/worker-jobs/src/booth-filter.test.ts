import { describe, it, expect } from "vitest";
import { containsForbidden, clampLength, MAX_CHARS, ttsEnabled } from "./booth-filter";

describe("forbidden-vocab filter", () => {
  it("flags every forbidden root + common inflections", () => {
    for (const w of ["bet", "bets", "betting", "stake", "stakes", "staking", "odds", "wager", "wagered", "gamble", "gambling", "gambler"]) {
      expect(containsForbidden(`the ${w} moved`)).toBe(true);
    }
  });

  it("does not flag allowed words or innocent substrings", () => {
    for (const w of ["price", "trade", "credits", "better", "betterment", "understand"]) {
      expect(containsForbidden(`a ${w} here`)).toBe(false);
    }
    expect(containsForbidden("The price ran to 60.0 and the trade filled for 40 credits.")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(containsForbidden("The ODDS shifted")).toBe(true);
    expect(containsForbidden("GAMBLE big")).toBe(true);
  });
});

describe("clampLength", () => {
  it("passes short strings through unchanged", () => {
    expect(clampLength("Home lead 2-0.")).toBe("Home lead 2-0.");
  });

  it("clamps overlong strings on a word boundary with an ellipsis", () => {
    const out = clampLength("word ".repeat(100).trim());
    expect(out.length).toBeLessThanOrEqual(MAX_CHARS);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toContain("  "); // no double spaces from the cut
  });
});

describe("ttsEnabled", () => {
  it("is off by default and on only when explicitly set", () => {
    expect(ttsEnabled({})).toBe(false);
    expect(ttsEnabled({ BOOTH_TTS: "1" })).toBe(true);
    expect(ttsEnabled({ BOOTH_TTS: "true" })).toBe(true);
    expect(ttsEnabled({ BOOTH_TTS: "0" })).toBe(false);
  });
});
