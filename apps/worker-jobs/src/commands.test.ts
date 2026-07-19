// VERIFY (ADR-085 GAP 2): command renderers produce the right content AND obey the copy law — zero gambling
// vocabulary anywhere a judge could read (bet/stake/odds/wager/gamble). Pure functions, no IO.
import { describe, it, expect } from "vitest";
import { parseCommand, cmdStart, cmdHelp, cmdMatches, cmdPrice, cmdLeaderboard, cmdUnknown, type Reply } from "./commands";
import type { CardState } from "./card";
import type { FixtureLite, TraderRow } from "./providers";

const GAMBLING = /\b(bet|bets|stake|stakes|odds|wager|wagers|gamble|gambling)\b/i;
const APP = "https://ninety-nu.vercel.app";

const card: CardState = {
  matchId: "18193785",
  state: "live",
  minute: 58,
  stage: "R16",
  home: { name: "Canada" },
  away: { name: "Morocco" },
  score: { home: 1, away: 2 },
  marketLabel: "WIN MARKET (play credits)",
  rows: [
    { label: "CAN", price: 41.0, delta: 2, spark: "" },
    { label: "DRW", price: 20.0, delta: 0, spark: "" },
    { label: "MAR", price: 39.0, delta: -2, spark: "" },
  ],
  traders: 0,
  topSwing: 0,
  updatedSecondsAgo: 2,
};
const fixtures: FixtureLite[] = [
  { matchId: "1", home: "Canada", away: "Morocco", competition: "R16", startTime: 1000, live: true },
  { matchId: "2", home: "Spain", away: "Argentina", competition: "Final", startTime: 2000, live: false },
];
const traders: TraderRow[] = [
  { rank: 1, userId: "hexfan", pnl: 2431 },
  { rank: 2, userId: "vd", pnl: 1200 },
];

describe("parseCommand", () => {
  it("parses cmd + arg, strips @botname, lower-cases the command", () => {
    expect(parseCommand("/start")).toEqual({ cmd: "start", arg: "" });
    expect(parseCommand("/price@NinetyBot Canada")).toEqual({ cmd: "price", arg: "Canada" });
    expect(parseCommand("/PRICE  Real Madrid ")).toEqual({ cmd: "price", arg: "Real Madrid" });
    expect(parseCommand("just chatting")).toBeNull();
  });
});

describe("command renderers", () => {
  it("/start explains Ninety and links to the app", () => {
    const r = cmdStart(APP);
    expect(r.text).toMatch(/Ninety/);
    expect(r.reply_markup?.inline_keyboard[0][0].url).toBe(APP);
  });

  it("/matches lists real fixtures, live-tagged; empty state when none", () => {
    const r = cmdMatches(fixtures);
    expect(r.text).toMatch(/Canada v Morocco/);
    expect(r.text).toMatch(/Spain v Argentina/);
    expect(r.text).toMatch(/LIVE/);
    expect(cmdMatches([]).text).toMatch(/No fixtures/i);
  });

  it("/price shows the live card's real prices + a Trade button; honest empty when no live market", () => {
    const r = cmdPrice("Canada", card, APP);
    expect(r.text).toMatch(/Canada 1–2 Morocco/);
    expect(r.text).toMatch(/CAN 41\.0/);
    expect(r.reply_markup?.inline_keyboard[0][0].url).toBe(`${APP}/match/18193785`);
    expect(cmdPrice("Narnia", null, APP).text).toMatch(/No live market/i);
    expect(cmdPrice("", null, APP).text).toMatch(/Add a team/i);
  });

  it("/leaderboard ranks traders in credits; warm-up empty state", () => {
    const r = cmdLeaderboard(traders);
    expect(r.text).toMatch(/hexfan/);
    expect(r.text).toMatch(/\+2,431 credits/);
    expect(cmdLeaderboard([]).text).toMatch(/warming up/i);
  });

  it("COPY LAW: no command output contains gambling vocabulary", () => {
    const all: Reply[] = [cmdStart(APP), cmdHelp(), cmdMatches(fixtures), cmdMatches([]), cmdPrice("Canada", card, APP), cmdPrice("x", null, APP), cmdLeaderboard(traders), cmdLeaderboard([]), cmdUnknown()];
    for (const r of all) {
      expect(r.text, r.text).not.toMatch(GAMBLING);
      for (const row of r.reply_markup?.inline_keyboard ?? []) for (const b of row) expect(b.text).not.toMatch(GAMBLING);
    }
    // Every reply says price/trade/credits somewhere across the surface (the sanctioned vocabulary is present).
    const surface = all.map((r) => r.text).join(" ");
    expect(surface).toMatch(/\b(price|prices|trade|credits|play-money)\b/i);
  });

  it("COPY LAW: boothVoice scrubs gambling words even if data smuggled them in", () => {
    // A pathological fixture name containing a forbidden whole-word is neutralised by the final filter.
    const r = cmdMatches([{ matchId: "9", home: "Place your bets FC", away: "United", competition: "Cup", startTime: 0, live: true }]);
    expect(r.text).not.toMatch(GAMBLING);
    expect(r.text).toMatch(/Place your trade FC/); // bets→trade (copy filter neutralises the whole word)
  });
});
