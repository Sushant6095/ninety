"use client";
// ── The single source of truth for LIVE match state (status · minute · score · prices · River) ───────
// ONE store, seeded at import, read by BOTH surfaces (/terminal and the / board) through the ONE hook
// `useMatchLive(matchId)`. Nothing else may own match status/minute/score/prices: the terminal's centre +
// rails, the board's cards, movers, ticker and command palette all read from here.
//
// Why an external store (useSyncExternalStore) and not context: the board renders ~22 rows and the
// terminal one; a single Map with per-id reads lets a tick to one match re-render only that match's
// consumers, with no context re-render storm and no duplicate drift loops.
//
// ── THE CLOCK (ADR-055) ────────────────────────────────────────────────────────────────────────────
// `spark[i]` IS minute i+1. The River's x-axis is match time, so the series ENDS at the live minute and
// grows with it — it can never render the future. Two beats drive it:
//   · driftTick()  — prices nudge; REPLACES the last spark point (movement *within* the current minute)
//   · minuteTick() — minute += 1; PUSHES a new point (the match clock advancing)
// Both freeze for any match that is not LIVE, so a halt stops the clock and the River together.
//
// Fixture rule (ADR-051): fixtures are SEED-ONLY at module load; the app never derives live state from a
// fixture again. The fixture→API swap replaces the seed + ticks with the WS feed — no consumer changes.
import { useSyncExternalStore } from "react";
import { MARKETS } from "../../lib/fixtures";
import { MATCH } from "../../lib/terminal";
import type { MarketStatus, Outcome } from "../../lib/types";

/** The 4-state lifecycle every consumer branches on. The board's 7-state MarketStatus normalizes into this. */
export type MatchStatus = "PRE" | "LIVE" | "HALTED" | "SETTLED";

export interface MatchLiveState {
  matchId: string;
  status: MatchStatus;
  minute: number | null;
  score: { home: number; away: number } | null;
  phase: string; // "2ND HALF" etc — moving match context
  prices: Record<Outcome, number>; // outcome win-prob 0..1 — THE prices (a.k.a. the market mark)
  openPrices: Record<Outcome, number>; // the opening mark — every "Δ vs open" on the site derives from this
  spark: number[]; // primary River trace: spark[i] is the mark at minute i+1 (fair×100)
  homeSpark?: number[]; // optional secondary trace (the terminal River's context line)
  riverOutcome: Outcome; // which outcome `spark` tracks: H (board home-win%) / A (terminal away-win%)
}

/** Full time. The River's x-axis runs 0..FULL_TIME so an unplayed match reads as unplayed space. */
export const FULL_TIME = 90;

const OUTCOMES: Outcome[] = ["H", "D", "A"];
const DRIFT = 0.014; // max per-tick nudge to a raw outcome weight before renormalizing
const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const r1 = (n: number): number => Math.round(n * 10) / 10;

/** Normalize the board's 7-state MarketStatus into the 4-state SSOT lifecycle. */
export function toMatchStatus(s: MarketStatus): MatchStatus {
  switch (s) {
    case "LIVE":
      return "LIVE";
    case "HALTED":
      return "HALTED";
    case "SETTLED":
    case "RESOLVING":
    case "VOIDED":
      return "SETTLED";
    default:
      return "PRE"; // SCHEDULED | OPEN
  }
}

function driftPrices(p: Record<Outcome, number>): Record<Outcome, number> {
  const raw = OUTCOMES.map((o) => Math.max(0.02, Math.min(0.96, p[o] + (Math.random() - 0.5) * DRIFT)));
  const sum = raw[0] + raw[1] + raw[2];
  return { H: r3(raw[0] / sum), D: r3(raw[1] / sum), A: r3(raw[2] / sum) };
}

/** Re-anchor one outcome to an explicit level; the other two absorb the remainder in their current proportion. */
function anchor(p: Record<Outcome, number>, o: Outcome, pct: number): Record<Outcome, number> {
  const v = Math.max(0.02, Math.min(0.97, pct / 100));
  const others = OUTCOMES.filter((x) => x !== o);
  const restNow = others.reduce((s, x) => s + p[x], 0) || 1e-6;
  const rest = 1 - v;
  const next = { ...p, [o]: r3(v) } as Record<Outcome, number>;
  for (const x of others) next[x] = r3(rest * (p[x] / restNow));
  return next;
}

/** A flat pre-event trace, one point per elapsed minute — the River as it stands *before* the news lands. */
function flatTrace(base: number, minutes: number): number[] {
  return Array.from({ length: minutes }, (_, i) => r1(base + Math.sin(i * 0.7) * 0.9));
}

/** Stretch a fixture's price history onto the minute axis, preserving its SHAPE.
 *
 *  The board's mini-sparks autoscale to their own min/max, so seeding them with a synthetic flat trace turns a
 *  0.9-point wobble into a full-height sawtooth comb — the row reads as violent noise when the market is calm.
 *  Resampling the real seeded trend keeps each row's story (and its scale) while still ending at the live minute. */
function resample(src: number[], minutes: number): number[] {
  if (minutes <= 1 || src.length < 2) return [src[src.length - 1] ?? 0];
  const last = src.length - 1;
  return Array.from({ length: minutes }, (_, i) => {
    const p = (i / (minutes - 1)) * last;
    const lo = Math.floor(p);
    const hi = Math.min(last, lo + 1);
    return r1(src[lo] + (src[hi] - src[lo]) * (p - lo));
  });
}

// ── the terminal's money-shot seed (ADR-054/055): ONE story, ONE clock ────────────────────────────────
// Australia v Egypt sits GOALLESS at 74'. Egypt's win% has been flat ~31 all match. Ashour's counter lands
// AT the live minute — the market halts, reprices 31 → 55, the score steps 0–0 → 0–1, and the Booth calls
// it. Everything on screen (header, River, rails, Booth, events) reads 74' because there is only one clock.
export const MONEY_SHOT = {
  minute: 74,
  phase: "2ND HALF",
  awayPre: 31, // Egypt win% before the goal
  awayPost: 55, // …and after the reprice
  prices: { H: 0.48, D: 0.21, A: 0.31 } as Record<Outcome, number>, // 0–0, Australia a narrow favourite
} as const;

const moneyShotFrame = (): MatchLiveState => ({
  matchId: MATCH.matchId,
  status: "LIVE",
  minute: MONEY_SHOT.minute,
  score: { home: 0, away: 0 },
  phase: MONEY_SHOT.phase,
  prices: { ...MONEY_SHOT.prices },
  openPrices: { ...MONEY_SHOT.prices },
  spark: flatTrace(MONEY_SHOT.awayPre, MONEY_SHOT.minute),
  homeSpark: flatTrace(MONEY_SHOT.prices.H * 100, MONEY_SHOT.minute),
  riverOutcome: "A", // the terminal River tracks the away-win % (Egypt)
});

// ── seed ────────────────────────────────────────────────────────────────────────────────────────
const map = new Map<string, MatchLiveState>();

for (const m of MARKETS) {
  const prices = (m.mark ?? { H: 0, D: 0, A: 0 }) as Record<Outcome, number>;
  const minute = m.minute;
  map.set(m.matchId, {
    matchId: m.matchId,
    status: toMatchStatus(m.status),
    minute,
    score: m.score,
    phase: minute == null ? "PRE-MATCH" : minute > 45 ? "2ND HALF" : "1ST HALF",
    prices,
    openPrices: { ...prices },
    // The board's mini-river tracks the home-win %, on the same minute-indexed axis as the terminal's — but it
    // keeps the fixture's real trend shape rather than a synthetic one (see resample).
    spark: minute == null ? m.spark.slice() : resample(m.spark, minute),
    riverOutcome: "H",
  });
}

// The terminal's traded market overrides its board row with the money-shot frame — ONE entry, so /terminal
// and the / board are literally reading the same object and can never disagree.
map.set(MATCH.matchId, moneyShotFrame());

/** The terminal's traded match id — consumers on /terminal read `useMatchLive(TERMINAL_MATCH_ID)`. */
export const TERMINAL_MATCH_ID = MATCH.matchId;

// The frozen opening frame of every match — what `rewindMatch` restores before a halt choreography replays.
const seeds = new Map<string, MatchLiveState>([...map].map(([id, s]) => [id, { ...s }]));

// ── subscription ──────────────────────────────────────────────────────────────────────────────────
const listeners = new Set<() => void>();
let listSnapshot: MatchLiveState[] = [...map.values()];

function emit(): void {
  listSnapshot = [...map.values()];
  for (const l of listeners) l();
}
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

// ── writes (the single writer surface) ─────────────────────────────────────────────────────────────
/** Set a match's lifecycle status. Drives the whole surface — while HALTED its clock and prices freeze. */
export function setMatchStatus(matchId: string, status: MatchStatus): void {
  const s = map.get(matchId);
  if (!s || s.status === status) return;
  map.set(matchId, { ...s, status });
  emit();
}

/** Step the score (the goal landing on the cliff). */
export function setScore(matchId: string, score: { home: number; away: number }): void {
  const s = map.get(matchId);
  if (!s) return;
  map.set(matchId, { ...s, score });
  emit();
}

/** Re-anchor the prices to an explicit level for one outcome — the halt's controlled reprice. PRICES ONLY:
 *  the cells and tags tick-flash, but the River canvas is untouched so the SVG cliff can draw on first. */
export function repriceMatch(matchId: string, outcome: Outcome, pct: number): void {
  const s = map.get(matchId);
  if (!s) return;
  map.set(matchId, { ...s, prices: anchor(s.prices, outcome, pct) });
  emit();
}

/** Let the River catch up to the (already repriced) prices — the single controlled canvas update, run AFTER
 *  the SVG cliff has drawn on. Writes into the CURRENT minute's point: a reprice is not a new minute. */
export function settleSpark(matchId: string): void {
  const s = map.get(matchId);
  if (!s || !s.spark.length) return;
  map.set(matchId, { ...s, ...writeCurrentMinute(s, s.prices) });
  emit();
}

/** Rewind a match to its seeded opening frame, so a halt always replays from a known state (never from wherever
 *  the drift happened to leave it). Both surfaces' choreographies start here. */
export function rewindMatch(matchId: string): void {
  const seed = seeds.get(matchId);
  if (!seed) return;
  map.set(matchId, { ...seed, prices: { ...seed.prices }, spark: seed.spark.slice(), homeSpark: seed.homeSpark?.slice() });
  emit();
}

/** Overwrite the CURRENT minute's River point(s) — price movement inside a minute never extends the x-axis. */
function writeCurrentMinute(s: MatchLiveState, prices: Record<Outcome, number>): Partial<MatchLiveState> {
  const at = (arr: number[], v: number): number[] => [...arr.slice(0, -1), r1(v)];
  return {
    prices,
    spark: at(s.spark, prices[s.riverOutcome] * 100),
    homeSpark: s.homeSpark ? at(s.homeSpark, prices.H * 100) : undefined,
  };
}

/** One price beat: nudge every LIVE market's prices *within* the current minute. Halts/pre/settled freeze. */
export function driftTick(): void {
  let changed = false;
  for (const [id, s] of map) {
    if (s.status !== "LIVE" || s.minute == null || !s.spark.length) continue;
    map.set(id, { ...s, ...writeCurrentMinute(s, driftPrices(s.prices)) });
    changed = true;
  }
  if (changed) emit();
}

/** One clock beat: every LIVE match advances a minute and its River grows a point. Stops at full time. */
export function minuteTick(): void {
  let changed = false;
  for (const [id, s] of map) {
    if (s.status !== "LIVE" || s.minute == null || s.minute >= FULL_TIME) continue;
    const minute = s.minute + 1;
    map.set(id, {
      ...s,
      minute,
      phase: minute > 45 ? "2ND HALF" : "1ST HALF",
      spark: [...s.spark, r1(s.prices[s.riverOutcome] * 100)],
      homeSpark: s.homeSpark ? [...s.homeSpark, r1(s.prices.H * 100)] : undefined,
    });
    changed = true;
  }
  if (changed) emit();
}

// ── reads (the ONE hook) ───────────────────────────────────────────────────────────────────────────
function getState(matchId: string): MatchLiveState | null {
  return map.get(matchId) ?? null;
}
function getList(): MatchLiveState[] {
  return listSnapshot;
}

/** THE single read hook: live { status, minute, score, prices, … } for one match, on either surface. */
export function useMatchLive(matchId: string): MatchLiveState | null {
  return useSyncExternalStore(
    subscribe,
    () => getState(matchId),
    () => getState(matchId),
  );
}

/** The whole live slate — for the board's status filters/counts and the movers rail. Stable ref between beats. */
export function useMatchLiveList(): MatchLiveState[] {
  return useSyncExternalStore(subscribe, getList, getList);
}
