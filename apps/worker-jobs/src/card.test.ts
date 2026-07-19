import { describe, it, expect } from "vitest";
import { renderCard, sparkline, boothVoice, escapeMd, type CardState } from "./card";

const APP = "https://ninety-nu.vercel.app";

function liveState(over: Partial<CardState> = {}): CardState {
  return {
    matchId: "18193785",
    state: "live",
    minute: 74,
    stage: "Round of 16",
    home: { name: "Canada", code: "CAN", flag: "🇨🇦" },
    away: { name: "Morocco", code: "MAR", flag: "🇲🇦" },
    score: { home: 1, away: 0 },
    marketLabel: "WIN MARKET (play credits)",
    rows: [
      { label: "CAN", price: 61.4, delta: 2.1, spark: "▁▂▃▄▅▆▇█" },
      { label: "DRW", price: 22.1, delta: -1.4, spark: "█▇▆▅▄▃▂▁" },
      { label: "MAR", price: 16.5, delta: -0.7, spark: "▅▄▃▂▁▁▁▁" },
    ],
    lastEvent: "38' Goal — Canada",
    booth: "Morocco pushing.",
    traders: 1204,
    topSwing: 842,
    updatedSecondsAgo: 3,
    ...over,
  };
}

describe("renderCard (pure)", () => {
  it("renders the live card — golden snapshot", () => {
    const { text } = renderCard(liveState(), APP);
    expect(text).toMatchInlineSnapshot(`
      "⚡ LIVE 74'  ·  Round of 16
      🇨🇦 CANADA 1 – 0 MOROCCO 🇲🇦

      *WIN MARKET \\(play credits\\)*
      \`\`\`
      CAN   61.4  ▲2.1   ▁▂▃▄▅▆▇█
      DRW   22.1  ▼1.4   █▇▆▅▄▃▂▁
      MAR   16.5  ▼0.7   ▅▄▃▂▁▁▁▁
      \`\`\`

      ⚽ 38' Goal — Canada
      🎙 "Morocco pushing\\."

      👥 1,204 trading · 🔥 top swing \\+842
      updated 3s ago · faster than your TV"
    `);
    // load-bearing pieces (verify, not just lock):
    expect(text).toContain("⚡ LIVE 74'  ·  Round of 16");
    expect(text).toContain("🇨🇦 CANADA 1 – 0 MOROCCO 🇲🇦");
    expect(text).toContain("*WIN MARKET \\(play credits\\)*"); // parens escaped
    expect(text).toContain("👥 1,204 trading · 🔥 top swing \\+842"); // '+' escaped for MarkdownV2
    expect(text).toContain("updated 3s ago · faster than your TV");
    expect(text).toContain("🎙 \"Morocco pushing\\.\""); // '.' escaped inside booth
  });

  it("keyboard links to the app match URL + a Follow callback", () => {
    const { reply_markup } = renderCard(liveState(), APP);
    const [trade, follow] = reply_markup.inline_keyboard[0];
    expect(trade.url).toBe("https://ninety-nu.vercel.app/match/18193785");
    expect(follow.callback_data).toBe("follow:18193785");
  });

  it("HALTED flips the header to repricing", () => {
    const { text } = renderCard(liveState({ state: "halted" }), APP);
    expect(text).toContain("🟠 HALTED — repricing");
    expect(text).not.toContain("⚡ LIVE");
  });

  it("SETTLED shows the result + proof line + a Solscan verify button", () => {
    const { text, reply_markup } = renderCard(
      liveState({ state: "settled", settled: { result: "H", sig: "5xSig", solscanUrl: "https://solscan.io/tx/5xSig?cluster=devnet" } }),
      APP,
    );
    expect(text).toContain("✅ proof verified on Solana");
    expect(text).toContain("🏁 Result: H");
    expect(reply_markup.inline_keyboard[0][0].url).toBe("https://solscan.io/tx/5xSig?cluster=devnet");
  });

  it("MarkdownV2-escapes dangerous dynamic text", () => {
    const { text } = renderCard(liveState({ stage: "1/8 (extra_time) [!]" }), APP);
    expect(text).toContain("1/8 \\(extra\\_time\\) \\[\\!\\]");
  });

  it("enforces the 3500-char hard cap", () => {
    const { text } = renderCard(liveState({ booth: "x".repeat(9000) }), APP);
    expect(text.length).toBeLessThanOrEqual(3500);
  });

  it("booth voice strips forbidden words (never bet/stake/odds/wager)", () => {
    expect(boothVoice("Big bet on the odds, high stakes, wager now")).toBe("Big trade on the price, high credits, trade now");
    const { text } = renderCard(liveState({ booth: "Place your bets — the odds moved" }), APP);
    expect(text).not.toMatch(/\bbet(s)?\b/i);
    expect(text).not.toMatch(/\bodds\b/i);
  });

  it("escapeMd escapes every reserved char", () => {
    expect(escapeMd("a_b*c[d]e(f)~`>#+-=|{}.!")).toBe("a\\_b\\*c\\[d\\]e\\(f\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!");
  });
});

describe("sparkline", () => {
  it("maps flat data to a flat line and shows a cliff on a jump", () => {
    expect(sparkline([5, 5, 5, 5])).toBe("▁▁▁▁");
    const cliff = sparkline([10, 10, 10, 10, 90, 90, 90, 90]);
    expect(cliff[0]).toBe("▁"); // pre-jump floor
    expect(cliff[cliff.length - 1]).toBe("█"); // post-jump ceiling
  });
  it("resamples a long series into ≤16 columns (bounded width)", () => {
    const long = Array.from({ length: 400 }, (_, i) => i);
    expect(sparkline(long).length).toBe(16);
  });
});
