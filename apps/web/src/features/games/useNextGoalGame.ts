"use client";
// The Next Goal state machine (ADR-057) — READ-ONLY. It reads the ONE live store via useMatchLive and
// resolves purely by observing a score delta while LOCKED. It imports NO store writers and never touches
// match state; the goal is produced by the page's feed harness (app/play/matchSimHarness.ts). The only
// coupling to the page is two plain UI callbacks (onLock/onReset) — round events, not match state.
import { useCallback, useEffect, useRef, useState } from "react";
import { useMatchLive, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import {
  applyResult,
  celebrationTier,
  detectGoal,
  loadStats,
  resultFor,
  saveStats,
  PICK_MS,
  RESOLVE_WINDOW_MS,
  FLASH_MS,
  EMPTY_STATS,
  type GameStats,
  type Phase,
  type Result,
  type Score,
  type Side,
} from "./nextGoalMachine";

export interface NextGoalView {
  phase: Phase;
  pick: Side | null;
  stats: GameStats;
  result: Result | null;
  scored: Side | null; // which side scored (WON/LOST); null on NO_CALL
  tier: 0 | 1 | 2 | 3 | 4; // celebration escalation for a win
  pickStartedAt: number | null; // when the current countdown began (stable across a side-switch)
  match: { score: Score; minute: number | null; status: string };
}

const ZERO: Score = { home: 0, away: 0 };

/** @param onLock  fired when a pick commits — the page harness uses it to schedule the (store-owned) goal.
 *  @param onReset fired when a new round starts — the harness rewinds the demo match to its seed. */
export function useNextGoalGame(onLock: () => void, onReset: () => void): NextGoalView & {
  choose: (side: Side) => void;
  next: () => void;
} {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const score: Score = live?.score ?? ZERO;

  const [phase, setPhase] = useState<Phase>("READY");
  const [pick, setPick] = useState<Side | null>(null);
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [result, setResult] = useState<Result | null>(null);
  const [scored, setScored] = useState<Side | null>(null);
  const [tier, setTier] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [pickStartedAt, setPickStartedAt] = useState<number | null>(null);

  const phaseRef = useRef<Phase>("READY");
  phaseRef.current = phase;
  const pickRef = useRef<Side | null>(null);
  pickRef.current = pick;
  const lockScore = useRef<Score>(ZERO);
  const timers = useRef<number[]>([]);
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  // hydrate persisted stats after mount (localStorage is client-only)
  useEffect(() => setStats(loadStats()), []);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]); // cleanup on unmount

  // finalize a round: apply + persist stats, paint the verdict
  const finalize = useCallback((res: Result, scoredSide: Side | null) => {
    setScored(scoredSide);
    setStats((prev) => {
      const nextStats = applyResult(prev, res);
      saveStats(nextStats);
      setTier(res === "WON" ? celebrationTier(nextStats.streak) : 0);
      return nextStats;
    });
    setResult(res);
    setPhase(res); // WON | LOST | NO_CALL
  }, []);

  // RESOLVING: a short goal-flash beat, then the verdict
  const resolve = useCallback(
    (scoredSide: Side | null) => {
      clearTimers();
      setPhase("RESOLVING");
      setScored(scoredSide);
      const res: Result = scoredSide === null ? "NO_CALL" : resultFor(pickRef.current ?? "H", scoredSide);
      after(FLASH_MS, () => finalize(res, scoredSide));
    },
    [after, clearTimers, finalize],
  );

  const lock = useCallback(() => {
    clearTimers();
    lockScore.current = score;
    setPhase("LOCKED");
    onLockRef.current(); // page harness schedules the store-owned goal
    after(RESOLVE_WINDOW_MS, () => resolve(null)); // no goal by the window → NO_CALL
  }, [after, clearTimers, resolve, score]);

  // watch the store for a goal WHILE LOCKED — the read-only resolution mechanism
  useEffect(() => {
    if (phaseRef.current !== "LOCKED") return;
    const g = detectGoal(lockScore.current, score);
    if (g) resolve(g);
  }, [score.home, score.away, resolve]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = useCallback(
    (side: Side) => {
      const p = phaseRef.current;
      if (p === "READY") {
        setPick(side);
        setPhase("PICKING");
        setPickStartedAt(Date.now());
        after(PICK_MS, lock);
        return;
      }
      if (p === "PICKING") {
        if (side === pickRef.current) lock(); // express lock: re-tap your side to commit now
        else setPick(side); // switch — the countdown keeps running (tension does not reset)
      }
    },
    [after, lock],
  );

  const next = useCallback(() => {
    clearTimers();
    onResetRef.current(); // harness rewinds the demo match to its seed for a fresh round
    setPick(null);
    setResult(null);
    setScored(null);
    setTier(0);
    setPickStartedAt(null);
    setPhase("READY");
  }, [clearTimers]);

  return {
    phase,
    pick,
    stats,
    result,
    scored,
    tier,
    pickStartedAt,
    match: { score, minute: live?.minute ?? null, status: live?.status ?? "LIVE" },
    choose,
    next,
  };
}
