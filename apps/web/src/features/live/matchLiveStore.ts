"use client";
// ── The single source of truth for LIVE match state (status · score · minute · prices) ──────────────
// ONE store, seeded from fixtures at import, read by BOTH surfaces (/terminal and the / board) through
// the ONE hook `useMatchLive(matchId)`. Nothing else may own match status/score/minute/prices: the
// terminal's center + rails, the board's cards, movers, ticker and command palette all read from here.
//
// Why an external store (useSyncExternalStore) and not context: the board renders ~22 rows and the
// terminal one; a single Map with per-id reads lets a tick to one match re-render only that match's
// consumers, with no context re-render storm and no duplicate drift loops. This replaces the old
// board-only LiveMarketsProvider AND the terminal-only useTerminalLive — a genuine single writer.
//
// Fixture rule (ADR-051 / mission): fixtures are SEED-ONLY at module load; the app never derives live
// status/score/minute/prices from a fixture again. The fixture→API swap happens at a later merge point
// by replacing the seed + drift with the WS feed — no consumer changes.
import { useSyncExternalStore } from "react";
import { MARKETS } from "../../lib/fixtures";
import { MATCH } from "../../lib/terminal";
import type { MarketStatus, Outcome } from "../../lib/types";

/** The 4-state lifecycle every consumer branches on. Board's 7-state MarketStatus normalizes into this. */
export type MatchStatus = "PRE" | "LIVE" | "HALTED" | "SETTLED";

export interface MatchLiveState {
  matchId: string;
  status: MatchStatus;
  minute: number | null;
  score: { home: number; away: number } | null;
  phase: string; // "2ND HALF" etc — moving match context
  prices: Record<Outcome, number>; // outcome win-prob 0..1 — THE prices (a.k.a. the market mark)
  spark: number[]; // primary River trace history (fair×100)
  homeSpark?: number[]; // optional secondary trace (terminal River context line)
  riverOutcome: Outcome; // which outcome `spark` tracks: H (board home-win%) / A (terminal away-win%)
}

const OUTCOMES: Outcome[] = ["H", "D", "A"];
const DRIFT = 0.014; // max per-tick nudge to a raw outcome weight before renormalizing
const SPARK_CAP = 80; // bounded River history
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

// ── seed ────────────────────────────────────────────────────────────────────────────────────────
const map = new Map<string, MatchLiveState>();

for (const m of MARKETS) {
  map.set(m.matchId, {
    matchId: m.matchId,
    status: toMatchStatus(m.status),
    minute: m.minute,
    score: m.score,
    phase: m.minute != null ? "2ND HALF" : "PRE-MATCH",
    prices: (m.mark ?? { H: 0, D: 0, A: 0 }) as Record<Outcome, number>,
    spark: m.spark.slice(),
    riverOutcome: "H", // board mini-river tracks the home-win % (LiveMarkets parity)
  });
}

// The terminal's traded market (Australia v Egypt) — its own richer seed, and it starts LIVE (the trading
// state), which is the value the header/status/switcher must all agree on. It is not in the board slate.
map.set(MATCH.matchId, {
  matchId: MATCH.matchId,
  status: "LIVE",
  minute: MATCH.minute,
  score: MATCH.score,
  phase: MATCH.phase,
  prices: { ...MATCH.mark },
  spark: MATCH.spark.slice(),
  homeSpark: MATCH.homeSpark.slice(),
  riverOutcome: "A", // terminal River tracks the away-win % (Egypt)
});

/** The terminal's traded match id — consumers on /terminal read `useMatchLive(TERMINAL_MATCH_ID)`. */
export const TERMINAL_MATCH_ID = MATCH.matchId;

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
/** Set a match's lifecycle status. Drives the whole surface — during HALTED prices freeze store-wide. */
export function setMatchStatus(matchId: string, status: MatchStatus): void {
  const s = map.get(matchId);
  if (!s || s.status === status) return;
  map.set(matchId, { ...s, status });
  emit();
}

/** One drift beat: nudge every LIVE market's prices and extend its River trace. Frozen for non-LIVE. */
export function driftTick(): void {
  let changed = false;
  for (const [id, s] of map) {
    if (s.status !== "LIVE" || s.minute == null) continue; // only in-play markets move; halts/pre/settled freeze
    const prices = driftPrices(s.prices);
    const spark = [...s.spark.slice(-(SPARK_CAP - 1)), r1(prices[s.riverOutcome] * 100)];
    const homeSpark = s.homeSpark ? [...s.homeSpark.slice(-(SPARK_CAP - 1)), r1(prices.H * 100)] : undefined;
    map.set(id, { ...s, prices, spark, homeSpark });
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

/** THE single read hook: live { status, score, minute, prices, … } for one match, on either surface. */
export function useMatchLive(matchId: string): MatchLiveState | null {
  return useSyncExternalStore(
    subscribe,
    () => getState(matchId),
    () => getState(matchId),
  );
}

/** The whole live slate — for the board's status filters/counts. Stable ref between beats. */
export function useMatchLiveList(): MatchLiveState[] {
  return useSyncExternalStore(subscribe, getList, getList);
}
