// Terminal (pro match-detail trading view) fixtures · shaped like the API the backend serves:
//   GET /markets/:id (detail + amm{q,b,spread_mult}, ADR-046 guarded emit) · GET /markets/:id/quote ·
//   GET /portfolio (positions + equity) · movers from market:{id}:open. Chunk-swappable 1:1 once the API boots.
import type { Outcome } from "./types";
import { koClock, MARKETS, SESSION } from "./fixtures";

// ── selected market detail (Australia vs Egypt · R16) ────────────────────────────
// SEED ONLY. Everything that MOVES during the match · minute, phase, score, prices, the River · is owned by
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
  stage: "Round of 16", competition: "World Cup 2026", venue: "Lumen Field",
  b: 1200, tick: 2.2,
  amm: { q: [-881, -1873, -1405], b: 1200, spreadMult: 1 }, // q = b·ln(p) → price(q,b) = {.480,.210,.310} pre-goal
  goalLabel: "GOAL 74' ASHOUR · 31 → 55",
};

/** The minute Ashour's counter lands · the live minute, because the goal happens NOW (the money shot). */
export const GOAL_MINUTE = 74;

// ── left rail: live competitions · DERIVED from MARKETS (one universe, A2) ───────
// The rail lists the SAME slate the board and ticker render; a second hand-written list here is how
// Argentina ends up in two matches at once. Seed identity only · live cells read the store.
export interface TermMarketRow {
  matchId: string; homeCode: string; awayCode: string; group: string; groupMeta: string;
  minute: number | null; time: string | null; score: [number, number] | null;
  mark: Record<Outcome, number>; fav: boolean; selected?: boolean;
}
const railSlate = MARKETS.filter((m) => m.status === "LIVE" || m.status === "OPEN");
const liveCount = railSlate.filter((m) => m.minute != null).length;
export const TERM_MARKETS: TermMarketRow[] = railSlate
  .map((m): TermMarketRow => ({
    matchId: m.matchId,
    homeCode: m.homeCode,
    awayCode: m.awayCode,
    group: m.minute != null ? "WORLD CUP · ROUND OF 16" : "ROUND OF 16",
    groupMeta: m.minute != null ? `LIVE · ${liveCount}` : `5–6 JUL · ${railSlate.length - liveCount}`,
    minute: m.minute,
    time: m.minute == null ? koClock(m.kickoffAt) : null,
    score: m.score ? [m.score.home, m.score.away] : null,
    mark: { H: m.mark?.H ?? 0, D: m.mark?.D ?? 0, A: m.mark?.A ?? 0 },
    fav: m.favourite,
    selected: m.matchId === "wc26-aus-egy",
  }))
  .sort((a, b) => Number(b.selected ?? false) - Number(a.selected ?? false) || Number(b.minute != null) - Number(a.minute != null));

// ── right rail data ──────────────────────────────────────────────────────────────
export interface PositionRow { marketId: string; code: string; vs: string; outcome: Outcome; shares: number; avgEntry: number; pnl: number | null; live: boolean; pre?: boolean; }
// Your EGY position averages 41.0 · under water at the pre-goal 31, and it flips green on Ashour's
// counter. P&L is computed live off the store's mark, never seeded (a seeded P&L is a P&L that can lie).
// Shares/entries MATCH lib/portfolio.ts (same account, two surfaces · they may never disagree).
export const POSITIONS: PositionRow[] = [
  { marketId: "wc26-aus-egy", code: "EGY", vs: "AUS", outcome: "A", shares: 60, avgEntry: 41.0, pnl: null, live: true },
  { marketId: "wc26-can-mar", code: "CAN", vs: "MAR", outcome: "H", shares: 40, avgEntry: 52.0, pnl: null, live: true },
  { marketId: "wc26-fra-sen", code: "FRA", vs: "SEN", outcome: "H", shares: 25, avgEntry: 63.0, pnl: null, live: true },
];

// Movers · the notes/pairings are still; every row is a MARKETS match, so TodaysMovers reads price + Δ vs
// open from the live store for all of them (`price`/`delta` are only the pre-hydration seed).
export interface MoverRow { matchId: string; code: string; vs: string; outcome: Outcome; price: number; delta: number; note: string; }
export const MOVERS: MoverRow[] = [
  // note must agree with the same screen's scoreboard/Booth (read-out-loud law): Ashour scored at 74'.
  { matchId: "wc26-aus-egy", code: "EGY", vs: "AUS", outcome: "A", price: 55.3, delta: 24.3, note: "Ashour repriced it 31 → 55" },
  { matchId: "wc26-bra-kor", code: "BRA", vs: "KOR", outcome: "H", price: 86.0, delta: 15.0, note: "two up before the hour" },
  { matchId: "wc26-ned-usa", code: "USA", vs: "NED", outcome: "A", price: 26.4, delta: 8.0, note: "level after half an hour · USA bid" },
  { matchId: "wc26-can-mar", code: "CAN", vs: "MAR", outcome: "H", price: 61.4, delta: 9.4, note: "a goal to the good" },
  { matchId: "wc26-eng-sui", code: "ENG", vs: "SUI", outcome: "H", price: 52.0, delta: 0, note: "team news: Kane starts" },
];

// The match feed. Goalless build-up · Ashour's counter at 74' is NOT here: it lands live, on the cliff, and
// LatestEvents prepends it the moment the score steps. An event list may never show a goal the score denies.
export interface EventRow { minute: number; text: string; kind: "play" | "sub" | "goal" | "card"; }
export const EVENTS: EventRow[] = [
  { minute: 68, text: "Baccus on · Bos off (Australia)", kind: "sub" },
  { minute: 61, text: "Yellow · Metcalfe (Australia), tactical foul", kind: "card" },
  { minute: 52, text: "Egypt corner · Marmoush heads wide", kind: "play" },
  { minute: 45, text: "Half-time · goalless at Lumen Field", kind: "play" },
  { minute: 22, text: "Saved · Mohamed forces Ryan low to his right", kind: "play" },
];

// The 74' goal is NOT in EVENTS · it lands live, on the cliff, the instant the score steps. Defined ONCE here so
// the rail (LatestEvents) and the depth timeline (EventsTimeline) can never disagree on its minute or wording.
export const GOAL_EVENT: EventRow = { minute: GOAL_MINUTE, text: "GOAL · Ashour (Egypt), assist Hafez", kind: "goal" };

export const MARKET_STATUS = { status: "OPEN" as const, tick: 2.2, feedMs: 42, b: 1200, tradersIn: 3412 };

export const PORTFOLIO = {
  equity: 8534, free: 2450, changePct: 34.8,
  spark: [6100, 6180, 6050, 6320, 6280, 6510, 6470, 6740, 7020, 6980, 7310, 7590, 7520, 7880, 8140, 8090, 8360, 8534],
};

export const BOOTH = {
  lang: "EN", mode: "AUTO",
  text: "Baccus on for Bos pushes Australia to a back three, and Egypt are countering into the space · still goalless, but the away price is bid.",
};

// Attack-momentum bars: signed −100..100 (positive = away/Egypt attacking, bright ink; negative = home, muted).
export const ATTACK = {
  attacking: "EGYPT",
  bars: [12, 20, 8, -14, -8, 24, 40, 18, -10, 30, 52, 34, 16, -6, 22, 44, 60, 38, 20, -12, 28, 48, 66, 40, 24, 10, -8, 34, 56, 72],
};

// ONE identity: derive the tournament-rank view from the single SESSION source (lib/fixtures) so the handle and
// rank never contradict another panel. The "@you" second identity is gone · every panel shows SESSION.handle.
// (pnl is the tournament-specific P&L figure; handle + rank + delta come from the one session.)
export const SESSION_RANK = { rank: SESSION.rank, handle: SESSION.handle, pnl: 1214, delta: SESSION.rankDelta };

// The AI booth timeline · commentary + the market impact each event had. Goalless, like EVENTS: the 74'
// reprice is prepended live by BoothTimeline once the goal actually lands.
export interface BoothEvent { minute: number; text: string; delta: number; repriced?: string }
export const BOOTH_TIMELINE: BoothEvent[] = [
  { minute: 68, text: "Baccus on for Bos pushes Australia to a back three; Egypt now count on the counter.", delta: 1.4 },
  { minute: 61, text: "Metcalfe takes the yellow to stop the break · cheap at the price, and the book agrees.", delta: 0.6 },
  { minute: 52, text: "Egypt win a corner · pressure without a clear chance; the market barely moves.", delta: 0.2 },
  { minute: 22, text: "Ryan gets down to Mohamed. The best chance of the half, and Egypt are bid on it.", delta: 2.1 },
];

/** The Booth's call on the goal · pushed to the top of the timeline the moment Ashour's counter lands. */
export const BOOTH_GOAL: BoothEvent = {
  minute: GOAL_MINUTE,
  text: "Ashour finishes the counter · reprices Egypt 31 → 55 inside ninety seconds.",
  delta: 24,
  repriced: "31 → 55",
};
