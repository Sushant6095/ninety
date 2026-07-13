// Terminal (pro match-detail trading view) fixtures — shaped like the API the backend serves:
//   GET /markets/:id (detail + amm{q,b,spread_mult}, ADR-046 guarded emit) · GET /markets/:id/quote ·
//   GET /portfolio (positions + equity) · movers from market:{id}:open. Chunk-swappable 1:1 once the API boots.
import type { Outcome } from "./types";

// ── selected market detail (Australia vs Egypt · R32) ────────────────────────────
// SEED ONLY. Everything that MOVES during the match — minute, phase, score, prices, the River — is owned by
// the live store (features/live/matchLiveStore.ts), which seeds the money-shot frame: goalless at 74', Egypt
// flat ~31, Ashour's counter landing AT the live minute. The fields below are the still parts: names, badges,
// venue, the LMSR params, and the opening mark the store drifts away from. One clock, one story (ADR-055).
export interface TerminalMatch {
  marketId: string; matchId: string;
  home: string; away: string; homeCode: string; awayCode: string;
  homeMeta: string; awayMeta: string; // "HOME · FIFA #24 · GRP F 2ND"
  stage: string; competition: string; venue: string;
  b: number; tick: number; // LMSR b + tick seconds
  amm: { q: number[]; b: number; spreadMult: number }; // ADR-046 guarded emit (q real, not null)
  goalLabel: string; // the callout that reveals on the cliff as the goal lands
}

export const MATCH: TerminalMatch = {
  marketId: "wc26-aus-egy:1x2", matchId: "wc26-aus-egy",
  home: "Australia", away: "Egypt", homeCode: "AUS", awayCode: "EGY",
  homeMeta: "HOME · FIFA #24 · GRP F 2ND", awayMeta: "AWAY · FIFA #33 · GRP C 1ST",
  stage: "Round of 32", competition: "World Cup 2026", venue: "Lumen Field",
  b: 1200, tick: 2.2,
  amm: { q: [-881, -1873, -1405], b: 1200, spreadMult: 1 }, // q = b·ln(p) → price(q,b) = {.480,.210,.310} pre-goal
  goalLabel: "GOAL 74' ASHOUR · 31 → 55",
};

/** The minute Ashour's counter lands — the live minute, because the goal happens NOW (the money shot). */
export const GOAL_MINUTE = 74;

// ── left rail: live competitions (R32) ───────────────────────────────────────────
export interface TermMarketRow {
  matchId: string; homeCode: string; awayCode: string; group: string; groupMeta: string;
  minute: number | null; time: string | null; score: [number, number] | null;
  mark: Record<Outcome, number>; fav: boolean; selected?: boolean;
}
const g1 = "WORLD CUP — ROUND OF 32", g1m = "TODAY · 4";
const g2 = "ROUND OF 32", g2m = "SUN 6 JUL · 3";
export const TERM_MARKETS: TermMarketRow[] = [
  // The selected row is SEED ONLY — CompetitionsRail reads its minute/score/prices from the live store.
  { matchId: "wc26-aus-egy", homeCode: "AUS", awayCode: "EGY", group: g1, groupMeta: g1m, minute: 74, time: null, score: [0, 0], mark: { H: 0.48, D: 0.21, A: 0.31 }, fav: true, selected: true },
  { matchId: "wc26-arg-cpv", homeCode: "ARG", awayCode: "CPV", group: g1, groupMeta: g1m, minute: null, time: "03:30", score: null, mark: { H: 0.862, D: 0.098, A: 0.04 }, fav: false },
  { matchId: "wc26-col-gha", homeCode: "COL", awayCode: "GHA", group: g1, groupMeta: g1m, minute: null, time: "07:00", score: null, mark: { H: 0.69, D: 0.196, A: 0.114 }, fav: false },
  { matchId: "wc26-can-mar", homeCode: "CAN", awayCode: "MAR", group: g1, groupMeta: g1m, minute: null, time: "22:30", score: null, mark: { H: 0.44, D: 0.275, A: 0.285 }, fav: true },
  { matchId: "wc26-bra-nor", homeCode: "BRA", awayCode: "NOR", group: g2, groupMeta: g2m, minute: null, time: "01:30", score: null, mark: { H: 0.784, D: 0.139, A: 0.077 }, fav: false },
  { matchId: "wc26-par-fra", homeCode: "PAR", awayCode: "FRA", group: g2, groupMeta: g2m, minute: null, time: "02:30", score: null, mark: { H: 0.175, D: 0.195, A: 0.63 }, fav: false },
  { matchId: "wc26-mex-eng", homeCode: "MEX", awayCode: "ENG", group: g2, groupMeta: g2m, minute: null, time: "05:30", score: null, mark: { H: 0.263, D: 0.225, A: 0.512 }, fav: false },
];

// ── right rail data ──────────────────────────────────────────────────────────────
export interface PositionRow { marketId: string; code: string; vs: string; outcome: Outcome; shares: number; avgEntry: number; pnl: number | null; live: boolean; pre?: boolean; }
// Your EGY position was opened at 41.0 — under water at the pre-goal 31, and it flips green on Ashour's
// counter. P&L is computed live off the store's mark, never seeded (a seeded P&L is a P&L that can lie).
export const POSITIONS: PositionRow[] = [
  { marketId: "wc26-aus-egy", code: "EGY", vs: "AUS", outcome: "A", shares: 90, avgEntry: 41.0, pnl: null, live: true },
  { marketId: "wc26-can-mar", code: "CAN", vs: "MAR", outcome: "H", shares: 120, avgEntry: 44.0, pnl: null, live: false, pre: true },
  { marketId: "wc26-par-fra", code: "FRA", vs: "PAR", outcome: "A", shares: 40, avgEntry: 61.2, pnl: 72, live: true },
];

// Movers — the notes/pairings are still. TodaysMovers reads price + Δ vs open from the live store when the
// match is on it (the traded one always is); `price`/`delta` are the seed for the R32 rows the store doesn't
// carry, so an unlisted match shows its real opening price rather than a zero.
export interface MoverRow { matchId: string; code: string; vs: string; outcome: Outcome; price: number; delta: number; note: string; }
export const MOVERS: MoverRow[] = [
  { matchId: "wc26-aus-egy", code: "EGY", vs: "AUS", outcome: "A", price: 31.0, delta: 0, note: "goalless at 74' — pressing" },
  { matchId: "wc26-arg-cpv", code: "ARG", vs: "CPV", outcome: "H", price: 86.2, delta: 1.4, note: "heaviest favourite of R32" },
  { matchId: "wc26-mex-eng", code: "ENG", vs: "MEX", outcome: "A", price: 51.2, delta: 2.8, note: "team news: Kane starts" },
  { matchId: "wc26-col-gha", code: "GHA", vs: "COL", outcome: "A", price: 11.4, delta: -2.2, note: "Nkunku doubtful" },
  { matchId: "wc26-can-mar", code: "CAN", vs: "MAR", outcome: "H", price: 61.4, delta: 4.1, note: "one goal up at the hour" },
];

// The match feed. Goalless build-up — Ashour's counter at 74' is NOT here: it lands live, on the cliff, and
// LatestEvents prepends it the moment the score steps. An event list may never show a goal the score denies.
export interface EventRow { minute: number; text: string; kind: "play" | "sub" | "goal" | "card"; }
export const EVENTS: EventRow[] = [
  { minute: 68, text: "Baccus on · Bos off (Australia)", kind: "sub" },
  { minute: 61, text: "Yellow — Metcalfe (Australia), tactical foul", kind: "card" },
  { minute: 52, text: "Egypt corner — Marmoush heads wide", kind: "play" },
  { minute: 45, text: "Half-time · goalless at Lumen Field", kind: "play" },
  { minute: 22, text: "Saved — Mohamed forces Ryan low to his right", kind: "play" },
];

export const MARKET_STATUS = { status: "OPEN" as const, tick: 2.2, feedMs: 42, b: 1200, tradersIn: 3412 };

export const PORTFOLIO = {
  equity: 8534, free: 2450, changePct: 34.8,
  spark: [6100, 6180, 6050, 6320, 6280, 6510, 6470, 6740, 7020, 6980, 7310, 7590, 7520, 7880, 8140, 8090, 8360, 8534],
};

export const BOOTH = {
  lang: "EN", mode: "AUTO",
  text: "Baccus on for Bos pushes Australia to a back three, and Egypt are countering into the space — still goalless, but the away price is bid.",
};

// Attack-momentum bars: signed −100..100 (positive = away/Egypt attacking, bright ink; negative = home, muted).
export const ATTACK = {
  attacking: "EGYPT",
  bars: [12, 20, 8, -14, -8, 24, 40, 18, -10, 30, 52, 34, 16, -6, 22, 44, 60, 38, 20, -12, 28, 48, 66, 40, 24, 10, -8, 34, 56, 72],
};

export const SESSION_RANK = { rank: 142, handle: "@you", pnl: 1214, delta: 3 };

// The AI booth timeline — commentary + the market impact each event had. Goalless, like EVENTS: the 74'
// reprice is prepended live by BoothTimeline once the goal actually lands.
export interface BoothEvent { minute: number; text: string; delta: number; repriced?: string }
export const BOOTH_TIMELINE: BoothEvent[] = [
  { minute: 68, text: "Baccus on for Bos pushes Australia to a back three; Egypt now count on the counter.", delta: 1.4 },
  { minute: 61, text: "Metcalfe takes the yellow to stop the break — cheap at the price, and the book agrees.", delta: 0.6 },
  { minute: 52, text: "Egypt win a corner — pressure without a clear chance; the market barely moves.", delta: 0.2 },
  { minute: 22, text: "Ryan gets down to Mohamed. The best chance of the half, and Egypt are bid on it.", delta: 2.1 },
];

/** The Booth's call on the goal — pushed to the top of the timeline the moment Ashour's counter lands. */
export const BOOTH_GOAL: BoothEvent = {
  minute: GOAL_MINUTE,
  text: "Ashour finishes the counter — reprices Egypt 31 → 55 inside ninety seconds.",
  delta: 24,
  repriced: "31 → 55",
};
