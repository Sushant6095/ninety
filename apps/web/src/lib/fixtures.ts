// Replay/reference fixtures for the Home slice — the exact scenes from the locked reference (design/screens/home.png)
// and shaped like docs/api-samples/. Chunk 5 swaps these for GET /markets + GET /leaderboard on the running API.
import type { LeaderRow, MarketRow, SessionUser } from "./types";

const spark = (from: number, to: number, n = 24): number[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const eased = from + (to - from) * (t < 0.55 ? t * 0.3 : 0.165 + (t - 0.55) * 1.85);
    return Math.round((eased + Math.sin(i * 1.7) * 0.15) * 10) / 10;
  });

export const SESSION: SessionUser = { handle: "@vd", credits: 2450, rank: 142, rankDelta: 3 };

export const MARKETS: MarketRow[] = [
  {
    marketId: "wc26-can-mar:1x2", matchId: "wc26-can-mar", kind: "1X2", status: "LIVE",
    home: "Canada", away: "Morocco", homeCode: "CAN", awayCode: "MAR", homeFlag: "🇨🇦", awayFlag: "🇲🇦",
    stage: "Round of 16", competition: "Favourites", kickoffAt: "2026-07-04T19:00:00.000Z",
    minute: 74, score: { home: 1, away: 0 }, mark: { H: 0.614, D: 0.221, A: 0.165 },
    spark: spark(52, 61.4), favourite: true,
  },
  {
    marketId: "wc26-esp-jpn:1x2", matchId: "wc26-esp-jpn", kind: "1X2", status: "LIVE",
    home: "Spain", away: "Japan", homeCode: "ESP", awayCode: "JPN", homeFlag: "🇪🇸", awayFlag: "🇯🇵",
    stage: "Round of 16", competition: "Favourites", kickoffAt: "2026-07-04T18:00:00.000Z",
    minute: 58, score: { home: 2, away: 1 }, mark: { H: 0.682, D: 0.196, A: 0.122 },
    spark: spark(60, 68.2), favourite: true,
  },
  {
    marketId: "wc26-arg-mex:1x2", matchId: "wc26-arg-mex", kind: "1X2", status: "LIVE",
    home: "Argentina", away: "Mexico", homeCode: "ARG", awayCode: "MEX", homeFlag: "🇦🇷", awayFlag: "🇲🇽",
    stage: "Round of 16", competition: "World Cup — Round of 16", kickoffAt: "2026-07-04T20:30:00.000Z",
    minute: 12, score: { home: 0, away: 0 }, mark: { H: 0.441, D: 0.287, A: 0.272 },
    spark: spark(45, 44.1), favourite: false,
  },
];

// Compact ticker line across the top (all live/upcoming markets).
export interface TickerItem { matchId: string; code: string; score: string | null; lead: "H" | "D" | "A"; price: number; minute: number | null; time: string | null; }
export const TICKER: TickerItem[] = [
  { matchId: "wc26-can-mar", code: "CAN–MAR", score: "1–0", lead: "H", price: 61.4, minute: 74, time: null },
  { matchId: "wc26-esp-jpn", code: "ESP–JPN", score: "2–1", lead: "H", price: 68.2, minute: 58, time: null },
  { matchId: "wc26-arg-mex", code: "ARG–MEX", score: "0–0", lead: "H", price: 44.1, minute: 12, time: null },
  { matchId: "wc26-eng-sen", code: "ENG–SEN", score: null, lead: "H", price: 52.0, minute: null, time: "16:00" },
  { matchId: "wc26-ger-col", code: "GER–COL", score: null, lead: "H", price: 48.5, minute: null, time: "19:00" },
  { matchId: "wc26-bra-usa", code: "BRA–USA", score: null, lead: "H", price: 55.3, minute: null, time: "22:00" },
  { matchId: "wc26-par-fra", code: "PAR–FRA", score: null, lead: "A", price: 63.0, minute: null, time: "02:30" },
  { matchId: "wc26-aus-egy", code: "AUS–EGY", score: null, lead: "H", price: 33.8, minute: null, time: "05:00" },
];

export const LEADERS: LeaderRow[] = [
  { rank: 1, handle: "@pitchwizard", pnl: 18240 },
  { rank: 2, handle: "@hexfan", pnl: 16810 },
  { rank: 3, handle: "@atlasfox", pnl: 15290 },
  { rank: 4, handle: "@kdb_flow", pnl: 14105 },
  { rank: 5, handle: "@deltahedge", pnl: 13880 },
];
