// Terminal (pro match-detail trading view) fixtures — shaped like the API the backend serves:
//   GET /markets/:id (detail + amm{q,b,spread_mult}, ADR-046 guarded emit) · GET /markets/:id/quote ·
//   GET /portfolio (positions + equity) · movers from market:{id}:open. Chunk-swappable 1:1 once the API boots.
import type { Outcome } from "./types";

// ── selected market detail (Australia vs Egypt · R32 · 50') ──────────────────────
export interface TerminalMatch {
  marketId: string; matchId: string;
  home: string; away: string; homeCode: string; awayCode: string;
  homeMeta: string; awayMeta: string; // "HOME · FIFA #24 · GRP F 2ND"
  stage: string; competition: string; venue: string;
  minute: number; phase: string; score: { home: number; away: number };
  scorer: string; // "HAFEZ ← ASHOUR 13'"
  status: "OPEN" | "LIVE" | "HALTED" | "SETTLED";
  mark: Record<Outcome, number>; // H=home win, D=draw, A=away win (0..1)
  todayDelta: Record<Outcome, number>; // Δ price vs open, points
  b: number; tick: number; // LMSR b + tick seconds
  amm: { q: number[]; b: number; spreadMult: number }; // ADR-046 guarded emit (q real, not null)
  spark: number[]; goalIndex: number; goalLabel: string; // river = away(EGY) win% history
}

const winSpark = (): number[] => {
  // EGY win% history: flat ~31 pre-goal, jump at the 13' goal (31→55), grind up to 67.6.
  const pre = [30, 31, 30.5, 31, 32, 31.5, 32, 33]; // 0'..~12'
  const jump = [40, 48, 55, 54, 56]; // goal 13'
  const grind = Array.from({ length: 15 }, (_, i) => Math.round((56 + (67.6 - 56) * (i / 14) + Math.sin(i) * 0.5) * 10) / 10);
  return [...pre, ...jump, ...grind];
};

export const MATCH: TerminalMatch = {
  marketId: "wc26-aus-egy:1x2", matchId: "wc26-aus-egy",
  home: "Australia", away: "Egypt", homeCode: "AUS", awayCode: "EGY",
  homeMeta: "HOME · FIFA #24 · GRP F 2ND", awayMeta: "AWAY · FIFA #33 · GRP C 1ST",
  stage: "Round of 32", competition: "World Cup 2026", venue: "Lumen Field",
  minute: 50, phase: "2ND HALF", score: { home: 0, away: 1 },
  scorer: "HAFEZ ← ASHOUR 13'", status: "OPEN",
  mark: { H: 0.074, D: 0.25, A: 0.676 },
  todayDelta: { H: -33.6, D: -2.5, A: 36.6 },
  b: 1200, tick: 2.2,
  amm: { q: [-1460, 0, 1194], b: 1200, spreadMult: 1 }, // q = b·ln(p) recentered → price(q,b) ≈ {.074,.25,.676}
  spark: winSpark(), goalIndex: 8, goalLabel: "GOAL 13' ASHOUR · 31 → 55",
};

// ── left rail: live competitions (R32) ───────────────────────────────────────────
export interface TermMarketRow {
  matchId: string; homeCode: string; awayCode: string; group: string; groupMeta: string;
  minute: number | null; time: string | null; score: [number, number] | null;
  mark: Record<Outcome, number>; fav: boolean; selected?: boolean;
}
const g1 = "WORLD CUP — ROUND OF 32", g1m = "TODAY · 4";
const g2 = "ROUND OF 32", g2m = "SUN 6 JUL · 3";
export const TERM_MARKETS: TermMarketRow[] = [
  { matchId: "wc26-aus-egy", homeCode: "AUS", awayCode: "EGY", group: g1, groupMeta: g1m, minute: 50, time: null, score: [0, 1], mark: { H: 0.074, D: 0.25, A: 0.676 }, fav: true, selected: true },
  { matchId: "wc26-arg-cpv", homeCode: "ARG", awayCode: "CPV", group: g1, groupMeta: g1m, minute: null, time: "03:30", score: null, mark: { H: 0.862, D: 0.098, A: 0.04 }, fav: false },
  { matchId: "wc26-col-gha", homeCode: "COL", awayCode: "GHA", group: g1, groupMeta: g1m, minute: null, time: "07:00", score: null, mark: { H: 0.69, D: 0.196, A: 0.114 }, fav: false },
  { matchId: "wc26-can-mar", homeCode: "CAN", awayCode: "MAR", group: g1, groupMeta: g1m, minute: null, time: "22:30", score: null, mark: { H: 0.44, D: 0.275, A: 0.285 }, fav: true },
  { matchId: "wc26-bra-nor", homeCode: "BRA", awayCode: "NOR", group: g2, groupMeta: g2m, minute: null, time: "01:30", score: null, mark: { H: 0.784, D: 0.139, A: 0.077 }, fav: false },
  { matchId: "wc26-par-fra", homeCode: "PAR", awayCode: "FRA", group: g2, groupMeta: g2m, minute: null, time: "02:30", score: null, mark: { H: 0.175, D: 0.195, A: 0.63 }, fav: false },
  { matchId: "wc26-mex-eng", homeCode: "MEX", awayCode: "ENG", group: g2, groupMeta: g2m, minute: null, time: "05:30", score: null, mark: { H: 0.263, D: 0.225, A: 0.512 }, fav: false },
];

// ── right rail data ──────────────────────────────────────────────────────────────
export interface PositionRow { marketId: string; code: string; vs: string; outcome: Outcome; shares: number; avgEntry: number; pnl: number | null; live: boolean; pre?: boolean; }
export const POSITIONS: PositionRow[] = [
  { marketId: "wc26-aus-egy", code: "EGY", vs: "AUS", outcome: "A", shares: 90, avgEntry: 41.0, pnl: 2394, live: true },
  { marketId: "wc26-can-mar", code: "CAN", vs: "MAR", outcome: "H", shares: 120, avgEntry: 44.0, pnl: null, live: false, pre: true },
  { marketId: "wc26-par-fra", code: "FRA", vs: "PAR", outcome: "A", shares: 40, avgEntry: 61.2, pnl: 72, live: true },
];

export interface MoverRow { code: string; vs: string; price: number; delta: number; note: string; }
export const MOVERS: MoverRow[] = [
  { code: "EGY", vs: "AUS", price: 66.9, delta: 35.9, note: "open 31.0 · goal 13'" },
  { code: "ARG", vs: "CPV", price: 86.2, delta: 1.4, note: "heaviest favourite of R32" },
  { code: "ENG", vs: "MEX", price: 51.2, delta: 2.8, note: "team news: Kane starts" },
  { code: "GHA", vs: "COL", price: 11.4, delta: -2.2, note: "Nkunku doubtful" },
  { code: "AUS", vs: "EGY", price: 7.7, delta: -36.3, note: "trailing 0–1" },
];

export interface EventRow { minute: number; text: string; kind: "play" | "sub" | "goal" | "card"; }
export const EVENTS: EventRow[] = [
  { minute: 50, text: "Play resumes — Egypt corner won", kind: "play" },
  { minute: 46, text: "Baccus on · Bos off (Australia)", kind: "sub" },
  { minute: 45, text: "Half-time · Egypt lead 1–0", kind: "play" },
  { minute: 13, text: "GOAL — Ashour (Egypt), assist Hafez", kind: "goal" },
];

export const MARKET_STATUS = { status: "OPEN" as const, tick: 2.2, feedMs: 42, b: 1200, tradersIn: 3412 };

export const PORTFOLIO = {
  equity: 8534, free: 2450, changePct: 34.8,
  spark: [6100, 6180, 6050, 6320, 6280, 6510, 6470, 6740, 7020, 6980, 7310, 7590, 7520, 7880, 8140, 8090, 8360, 8534],
};

export const BOOTH = {
  lang: "EN", mode: "AUTO",
  text: "Baccus on for Bos pushes Australia to a back three; Egypt now count on the counter — win-prob just ticked to 67.6.",
};

// Attack-momentum bars: signed −100..100 (positive = away/Egypt attacking, green; negative = home, pink).
export const ATTACK = {
  attacking: "EGYPT", ballInPlay: "50'",
  bars: [12, 20, 8, -14, -8, 24, 40, 18, -10, 30, 52, 34, 16, -6, 22, 44, 60, 38, 20, -12, 28, 48, 66, 40, 24, 10, -8, 34, 56, 72],
};

export const SESSION_RANK = { rank: 142, handle: "@you", pnl: 1214, delta: 3 };
