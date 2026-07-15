// Next Goal — the PURE core (ADR-060). No React, no store, no DOM: just the state-machine vocabulary,
// the scoring math, the goal-detection, and localStorage persistence. Kept pure so the money/streak logic
// is unit-checkable (nextGoalMachine.test.ts) without a browser or the live store.

/** The explicit lifecycle (the one idea kept from game-developer). */
export type Phase = "READY" | "PICKING" | "LOCKED" | "RESOLVING" | "WON" | "LOST" | "NO_CALL";

/** A pick is one of the two sides. Home = the store's H outcome, Away = A. */
export type Side = "H" | "A";

/** The resolution outcome — the three ways a locked round can end. */
export type Result = "WON" | "LOST" | "NO_CALL";

export interface Score {
  home: number;
  away: number;
}

/** The only thing that persists (localStorage, ADR-060). No accounts, no backend. */
export interface GameStats {
  points: number;
  streak: number;
  best: number;
}

// ── timing (ms) — asymmetric by design (emil): the decision is slow and deliberate, the resolve is snappy ──
export const PICK_MS = 3000; // the countdown/lock window — the tension IS this
export const RESOLVE_WINDOW_MS = 2200; // no delta by here after lock → NO_CALL (no penalty)
export const FLASH_MS = 180; // the RESOLVING goal-flash beat before the verdict paints
export const PAYOFF_HOLD_MS = 500; // number count-up window on a win

// ── scoring ──
const BASE_POINTS = 100;
const MULT_STEP = 0.5; // each streak rung adds +0.5×
const MULT_CAP = 3; // …capped at 3× (streak 5+)

/** Streak multiplier for the award. `streak` is the RESULTING streak (after the win is counted). */
export function multiplierFor(streak: number): number {
  if (streak <= 0) return 0;
  return Math.min(MULT_CAP, 1 + (streak - 1) * MULT_STEP);
}

/** Points awarded for a win that brings the player to `streak`. */
export function awardFor(streak: number): number {
  return Math.round(BASE_POINTS * multiplierFor(streak));
}

/** Celebration escalation tier (0..4) from the resulting streak — a 3 MUST feel bigger than a 2. */
export function celebrationTier(streak: number): 0 | 1 | 2 | 3 | 4 {
  if (streak <= 0) return 0;
  if (streak === 1) return 1;
  if (streak === 2) return 2;
  if (streak <= 4) return 3;
  return 4;
}

/** Which side (if any) scored since the pick was locked — the read-only resolution signal. */
export function detectGoal(lockScore: Score, now: Score): Side | null {
  if (now.home > lockScore.home) return "H";
  if (now.away > lockScore.away) return "A";
  return null;
}

/** A goal for the picked side wins; the other side loses. */
export function resultFor(pick: Side, scored: Side): Result {
  return pick === scored ? "WON" : "LOST";
}

/** Apply a resolved result to the stats — immutable (coding-style law: never mutate). LOST never punishes
 *  points; it soft-resets the streak. NO_CALL leaves everything untouched. */
export function applyResult(stats: GameStats, result: Result): GameStats {
  if (result === "WON") {
    const streak = stats.streak + 1;
    return {
      points: stats.points + awardFor(streak),
      streak,
      best: Math.max(stats.best, streak),
    };
  }
  if (result === "LOST") {
    return { points: stats.points, streak: 0, best: stats.best };
  }
  return stats; // NO_CALL — streak safe
}

// ── persistence (localStorage ONLY) ──
export const STORAGE_KEY = "ninety.nextgoal.v1";
export const EMPTY_STATS: GameStats = { points: 0, streak: 0, best: 0 };

export function loadStats(): GameStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as Partial<GameStats>;
    return {
      points: Number.isFinite(parsed.points) ? Number(parsed.points) : 0,
      streak: Number.isFinite(parsed.streak) ? Number(parsed.streak) : 0,
      best: Number.isFinite(parsed.best) ? Number(parsed.best) : 0,
    };
  } catch {
    return EMPTY_STATS; // corrupt/unavailable storage never blocks play
  }
}

export function saveStats(stats: GameStats): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    /* private mode / quota — the round still played, just isn't remembered */
  }
}
