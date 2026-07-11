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
  SUI: "Switzerland", ITA: "Italy", NGA: "Nigeria", DEN: "Denmark", SWE: "Sweden", POL: "Poland", GHA: "Ghana",
  EGY: "Egypt", CPV: "Cape Verde", PAR: "Paraguay", NOR: "Norway", KSA: "Saudi Arabia", ECU: "Ecuador",
  CRC: "Costa Rica", TUN: "Tunisia", SRB: "Serbia", CMR: "Cameroon", QAT: "Qatar", IRN: "Iran", AUT: "Austria",
  TUR: "Türkiye", HUN: "Hungary", CZE: "Czechia", SVK: "Slovakia", UKR: "Ukraine",
};

interface Spec {
  hc: string; ac: string; comp: string; stage?: string; ko: string;
  min: number | null; score?: [number, number] | null; mark: [number, number, number];
  from: number; to: number; fav?: boolean; vol?: number; status?: MarketStatus;
}

/** Full country name for a FIFA code (falls back to the code). Shared by rankings / standings. */
export function teamName(code: string): string {
  return NAME[code] ?? code;
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
  // ── Round of 16 · live now ──────────────────────────────────────────────────
  mkt({ hc: "CAN", ac: "MAR", comp: "World Cup — Round of 16", ko: "2026-07-04T19:00:00Z", min: 74, score: [1, 0], mark: [0.614, 0.221, 0.165], from: 52, to: 61.4, fav: true, vol: 184200 }),
  mkt({ hc: "ESP", ac: "JPN", comp: "World Cup — Round of 16", ko: "2026-07-04T18:00:00Z", min: 58, score: [2, 1], mark: [0.682, 0.196, 0.122], from: 60, to: 68.2, fav: true, vol: 231800 }),
  mkt({ hc: "BRA", ac: "KOR", comp: "World Cup — Round of 16", ko: "2026-07-04T14:00:00Z", min: 55, score: [2, 0], mark: [0.86, 0.1, 0.04], from: 71, to: 86, fav: true, vol: 120400 }),
  mkt({ hc: "FRA", ac: "SEN", comp: "World Cup — Round of 16", ko: "2026-07-04T15:00:00Z", min: 41, score: [2, 0], mark: [0.74, 0.16, 0.1], from: 56, to: 74, fav: true, vol: 88100 }),
  mkt({ hc: "POR", ac: "URU", comp: "World Cup — Round of 16", ko: "2026-07-04T17:00:00Z", min: 63, score: [1, 0], mark: [0.58, 0.24, 0.18], from: 55, to: 58, vol: 64200 }),
  mkt({ hc: "NED", ac: "USA", comp: "World Cup — Round of 16", ko: "2026-07-04T16:00:00Z", min: 30, score: [1, 1], mark: [0.455, 0.281, 0.264], from: 62, to: 45.5, vol: 71300 }),
  mkt({ hc: "ARG", ac: "MEX", comp: "World Cup — Round of 16", ko: "2026-07-04T20:30:00Z", min: 12, score: [0, 0], mark: [0.441, 0.287, 0.272], from: 45, to: 44.1, vol: 96400 }),
  // ── Round of 16 · later today ───────────────────────────────────────────────
  mkt({ hc: "GER", ac: "COL", comp: "World Cup — Round of 16", ko: "2026-07-05T19:00:00Z", min: null, mark: [0.485, 0.27, 0.245], from: 49, to: 48.5, vol: 12750 }),
  mkt({ hc: "ENG", ac: "SUI", comp: "World Cup — Round of 16", ko: "2026-07-05T20:30:00Z", min: null, mark: [0.52, 0.26, 0.22], from: 50, to: 52, fav: true, vol: 9800 }),
  mkt({ hc: "ITA", ac: "NGA", comp: "World Cup — Round of 16", ko: "2026-07-05T22:00:00Z", min: null, mark: [0.55, 0.26, 0.19], from: 54, to: 55, vol: 8100 }),
  mkt({ hc: "DEN", ac: "SWE", comp: "World Cup — Round of 16", ko: "2026-07-05T23:30:00Z", min: null, mark: [0.47, 0.28, 0.25], from: 47, to: 47, vol: 6400 }),
  mkt({ hc: "POL", ac: "GHA", comp: "World Cup — Round of 16", ko: "2026-07-06T01:30:00Z", min: null, mark: [0.61, 0.23, 0.16], from: 60, to: 61, vol: 5200 }),
  // ── Group stage · final round ───────────────────────────────────────────────
  mkt({ hc: "EGY", ac: "CPV", comp: "World Cup — Group stage", stage: "Group F", ko: "2026-07-04T21:00:00Z", min: 70, score: [1, 1], mark: [0.4, 0.3, 0.3], from: 31, to: 40, vol: 18200 }),
  mkt({ hc: "PAR", ac: "NOR", comp: "World Cup — Group stage", stage: "Group E", ko: "2026-07-06T03:00:00Z", min: null, mark: [0.3, 0.28, 0.42], from: 45, to: 44, vol: 5200 }),
  mkt({ hc: "KSA", ac: "ECU", comp: "World Cup — Group stage", stage: "Group H", ko: "2026-07-06T05:00:00Z", min: null, mark: [0.33, 0.3, 0.37], from: 40, to: 40, vol: 2900 }),
  mkt({ hc: "CRC", ac: "TUN", comp: "World Cup — Group stage", stage: "Group I", ko: "2026-07-06T06:30:00Z", min: null, mark: [0.45, 0.27, 0.28], from: 46, to: 45, vol: 3100 }),
  // ── Finished today ──────────────────────────────────────────────────────────
  mkt({ hc: "SRB", ac: "CMR", comp: "Finished today", ko: "2026-07-04T12:00:00Z", min: null, score: [2, 1], mark: [1, 0, 0], from: 48, to: 88, vol: 44000, status: "SETTLED" }),
  mkt({ hc: "QAT", ac: "IRN", comp: "Finished today", ko: "2026-07-04T10:00:00Z", min: null, score: [0, 2], mark: [0, 0, 1], from: 44, to: 9, vol: 38000, status: "SETTLED" }),
  mkt({ hc: "AUT", ac: "TUR", comp: "Finished today", ko: "2026-07-04T09:00:00Z", min: null, score: [1, 1], mark: [0, 1, 0], from: 30, to: 40, vol: 26000, status: "SETTLED" }),
  // ── Earlier this week ───────────────────────────────────────────────────────
  mkt({ hc: "HUN", ac: "CZE", comp: "Earlier this week", ko: "2026-07-02T18:00:00Z", min: null, score: [2, 0], mark: [1, 0, 0], from: 42, to: 90, vol: 51000, status: "SETTLED" }),
  mkt({ hc: "SVK", ac: "UKR", comp: "Earlier this week", ko: "2026-07-02T15:00:00Z", min: null, score: [1, 2], mark: [0, 0, 1], from: 47, to: 12, vol: 33000, status: "SETTLED" }),
  mkt({ hc: "AUS", ac: "BEL", comp: "Earlier this week", ko: "2026-07-01T20:00:00Z", min: null, score: [0, 3], mark: [0, 0, 1], from: 40, to: 6, vol: 47000, status: "SETTLED" }),
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
