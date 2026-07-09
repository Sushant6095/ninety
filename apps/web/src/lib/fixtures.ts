// Replay/reference fixtures for the Home slice — shaped like docs/api-samples/. Chunk 5 swaps these for
// GET /markets + GET /leaderboard on the running API. Denser than a stub on purpose: a live exchange home
// needs a full board (multiple competitions, live + upcoming + finished), real metrics, and real assets.
import type { LeaderRow, MarketRow, MarketStatus, NewsItem, SessionUser } from "./types";

const spark = (from: number, to: number, n = 24): number[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const eased = from + (to - from) * (t < 0.55 ? t * 0.3 : 0.165 + (t - 0.55) * 1.85);
    return Math.round((eased + Math.sin(i * 1.7) * 0.15) * 10) / 10;
  });

const EMOJI: Record<string, string> = {
  CAN: "🇨🇦", MAR: "🇲🇦", ESP: "🇪🇸", JPN: "🇯🇵", ARG: "🇦🇷", MEX: "🇲🇽", USA: "🇺🇸", NED: "🇳🇱",
  GER: "🇩🇪", COL: "🇨🇴", BRA: "🇧🇷", KOR: "🇰🇷", FRA: "🇫🇷", SEN: "🇸🇳", POR: "🇵🇹", URU: "🇺🇾",
  ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", AUS: "🇦🇺", CRO: "🇭🇷", BEL: "🇧🇪",
};
const NAME: Record<string, string> = {
  CAN: "Canada", MAR: "Morocco", ESP: "Spain", JPN: "Japan", ARG: "Argentina", MEX: "Mexico", USA: "United States",
  NED: "Netherlands", GER: "Germany", COL: "Colombia", BRA: "Brazil", KOR: "South Korea", FRA: "France",
  SEN: "Senegal", POR: "Portugal", URU: "Uruguay", ENG: "England", AUS: "Australia", CRO: "Croatia", BEL: "Belgium",
};

interface Spec {
  hc: string; ac: string; comp: string; stage?: string; ko: string;
  min: number | null; score?: [number, number] | null; mark: [number, number, number];
  from: number; to: number; fav?: boolean; vol?: number; status?: MarketStatus;
}

function mkt(s: Spec): MarketRow {
  const [H, D, A] = s.mark;
  return {
    marketId: `wc26-${s.hc}-${s.ac}:1x2`.toLowerCase(),
    matchId: `wc26-${s.hc}-${s.ac}`.toLowerCase(),
    kind: "1X2",
    status: s.status ?? (s.min != null ? "LIVE" : "OPEN"),
    home: NAME[s.hc], away: NAME[s.ac], homeCode: s.hc, awayCode: s.ac,
    homeFlag: EMOJI[s.hc] ?? "", awayFlag: EMOJI[s.ac] ?? "",
    stage: s.stage ?? "Round of 16", competition: s.comp, kickoffAt: s.ko,
    minute: s.min, score: s.score ? { home: s.score[0], away: s.score[1] } : null, mark: { H, D, A },
    spark: spark(s.from, s.to), favourite: s.fav ?? false, volume: s.vol,
  };
}

export const SESSION: SessionUser = { handle: "@vd", credits: 2450, rank: 142, rankDelta: 3 };

export const MARKETS: MarketRow[] = [
  mkt({ hc: "CAN", ac: "MAR", comp: "Favourites", ko: "2026-07-04T19:00:00Z", min: 74, score: [1, 0], mark: [0.614, 0.221, 0.165], from: 52, to: 61.4, fav: true, vol: 184200 }),
  mkt({ hc: "ESP", ac: "JPN", comp: "Favourites", ko: "2026-07-04T18:00:00Z", min: 58, score: [2, 1], mark: [0.682, 0.196, 0.122], from: 60, to: 68.2, fav: true, vol: 231800 }),

  mkt({ hc: "ARG", ac: "MEX", comp: "World Cup — Round of 16", ko: "2026-07-04T20:30:00Z", min: 12, score: [0, 0], mark: [0.441, 0.287, 0.272], from: 45, to: 44.1, vol: 96400 }),
  mkt({ hc: "NED", ac: "USA", comp: "World Cup — Round of 16", ko: "2026-07-04T16:00:00Z", min: 30, score: [1, 1], mark: [0.455, 0.281, 0.264], from: 62, to: 45.5, vol: 71300 }),
  mkt({ hc: "GER", ac: "COL", comp: "World Cup — Round of 16", ko: "2026-07-05T19:00:00Z", min: null, mark: [0.485, 0.27, 0.245], from: 49, to: 48.5, vol: 12750 }),
  mkt({ hc: "BRA", ac: "KOR", comp: "World Cup — Round of 16", ko: "2026-07-05T22:00:00Z", min: null, mark: [0.72, 0.18, 0.1], from: 71, to: 72, vol: 20880 }),
  mkt({ hc: "FRA", ac: "SEN", comp: "World Cup — Round of 16", ko: "2026-07-06T02:30:00Z", min: null, mark: [0.56, 0.25, 0.19], from: 55, to: 56, vol: 8420 }),
  mkt({ hc: "POR", ac: "URU", comp: "World Cup — Round of 16", ko: "2026-07-06T05:00:00Z", min: null, mark: [0.47, 0.27, 0.26], from: 48, to: 47, vol: 6110 }),

  mkt({ hc: "ENG", ac: "AUS", comp: "Finished today", ko: "2026-07-04T14:00:00Z", min: null, score: [3, 1], mark: [1, 0, 0], from: 58, to: 92, vol: 154300, status: "SETTLED" }),
  mkt({ hc: "CRO", ac: "BEL", comp: "Finished today", ko: "2026-07-04T11:00:00Z", min: null, score: [1, 2], mark: [0, 0, 1], from: 52, to: 8, vol: 88700, status: "SETTLED" }),
];

// Compact ticker line across the top (all live/upcoming markets).
export interface TickerItem { matchId: string; code: string; score: string | null; lead: "H" | "D" | "A"; price: number; minute: number | null; time: string | null; }
export const TICKER: TickerItem[] = [
  { matchId: "wc26-can-mar", code: "CAN–MAR", score: "1–0", lead: "H", price: 61.4, minute: 74, time: null },
  { matchId: "wc26-esp-jpn", code: "ESP–JPN", score: "2–1", lead: "H", price: 68.2, minute: 58, time: null },
  { matchId: "wc26-ned-usa", code: "NED–USA", score: "1–1", lead: "H", price: 45.5, minute: 30, time: null },
  { matchId: "wc26-arg-mex", code: "ARG–MEX", score: "0–0", lead: "H", price: 44.1, minute: 12, time: null },
  { matchId: "wc26-ger-col", code: "GER–COL", score: null, lead: "H", price: 48.5, minute: null, time: "19:00" },
  { matchId: "wc26-bra-kor", code: "BRA–KOR", score: null, lead: "H", price: 72.0, minute: null, time: "22:00" },
  { matchId: "wc26-fra-sen", code: "FRA–SEN", score: null, lead: "H", price: 56.0, minute: null, time: "02:30" },
  { matchId: "wc26-por-uru", code: "POR–URU", score: null, lead: "H", price: 47.0, minute: null, time: "05:00" },
];

export const LEADERS: LeaderRow[] = [
  { rank: 1, handle: "@pitchwizard", pnl: 18240 },
  { rank: 2, handle: "@hexfan", pnl: 16810 },
  { rank: 3, handle: "@atlasfox", pnl: 15290 },
  { rank: 4, handle: "@kdb_flow", pnl: 14105 },
  { rank: 5, handle: "@deltahedge", pnl: 13880 },
  { rank: 6, handle: "@nilspread", pnl: 11420 },
  { rank: 7, handle: "@late_swing", pnl: 9860 },
  { rank: 8, handle: "@group_g_gm", pnl: 7315 },
  { rank: 9, handle: "@maple_maxi", pnl: 5120 },
  { rank: 10, handle: "@varhater", pnl: 3480 },
  { rank: 11, handle: "@stoppage", pnl: 1290 },
  { rank: 12, handle: "@own_goal", pnl: -640 },
];

export const NEWS: NewsItem[] = [
  { id: "n1", tag: "WORLD CUP", title: "Canada hold the 1–0 as Morocco pile on late pressure", when: "6m ago" },
  { id: "n2", tag: "MOMENTS", title: "The 38th minute: David's goal repriced CAN from 41 → 63", when: "22m ago" },
  { id: "n3", tag: "SETTLEMENT", title: "England 3–1 Australia settled on-chain — proof posted to devnet", when: "1h ago" },
  { id: "n4", tag: "MARKETS", title: "Spain vs Japan is today's most-traded market at 231.8k CR", when: "2h ago" },
];
