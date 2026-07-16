"use client";
// The Next Goal state machine (ADR-060) — READ-ONLY. It reads the ONE live store via useMatchLive and
// resolves purely by observing a score delta while LOCKED. It imports NO store writers and never touches
// match state; the goal is produced by the page's feed harness (app/play/matchSimHarness.ts). The only
// coupling to the page is two plain UI callbacks (onLock/onReset) — round events, not match state.
import { useCallback, useEffect, useRef, useState } from "react";
import { useMatchLive, subscribeMatch, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import {
  applyResult,
  celebrationTier,
  detectGoal,
  loadStats,
  resolvePick,
  saveStats,
  PICK_MS,
  RESOLVE_WINDOW_MS,
  FLASH_MS,
  EMPTY_STATS,
  type GameStats,
  type Phase,
  type Pick,
  type Result,
  type Score,
  type Side,
} from "./nextGoalMachine";
import { appendRound } from "./roundLog";

export interface NextGoalView {
  phase: Phase;
  pick: Pick | null;
  stats: GameStats;
  result: Result | null;
  scored: Side | null; // which side scored (WON/LOST); null on NO_CALL or a "nobody" win
  tier: 0 | 1 | 2 | 3 | 4; // celebration escalation for a win
  pickStartedAt: number | null; // when the current countdown began (stable across a side-switch)
  match: { score: Score; minute: number | null; status: string; spark: number[]; sparkOutcome: "H" | "D" | "A" };
}

const ZERO: Score = { home: 0, away: 0 };

/** @param onLock  fired when a pick commits — /play's harness uses it to schedule the (store-owned) goal;
 *                 on /terminal it is a no-op (the game reads the REAL halt goal, never fabricates one).
 *  @param onReset fired when a new round starts — /play rewinds the demo match; /terminal no-ops (read-only).
 *  @param opts.resolveWindowMs how long to wait after lock for a goal before NO_CALL (default /play's 2.2s). */
export function useNextGoalGame(
  onLock: () => void,
  onReset: () => void,
  opts?: { resolveWindowMs?: number },
): NextGoalView & {
  choose: (side: Pick) => void;
  next: () => void;
} {
  const resolveWindowMs = opts?.resolveWindowMs ?? RESOLVE_WINDOW_MS;
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const score: Score = live?.score ?? ZERO;

  const [phase, setPhase] = useState<Phase>("READY");
  const [pick, setPick] = useState<Pick | null>(null);
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS);
  const [result, setResult] = useState<Result | null>(null);
  const [scored, setScored] = useState<Side | null>(null);
  const [tier, setTier] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [pickStartedAt, setPickStartedAt] = useState<number | null>(null);

  const phaseRef = useRef<Phase>("READY");
  phaseRef.current = phase;
  const pickRef = useRef<Pick | null>(null);
  pickRef.current = pick;
  const minuteRef = useRef<number | null>(null);
  minuteRef.current = live?.minute ?? null;
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

  // finalize a round: apply + persist stats, paint the verdict. Resolved calls (never NO_CALL —
  // a non-event) also land in the round log for the /play history filter.
  const finalize = useCallback((res: Result, scoredSide: Side | null) => {
    if (res !== "NO_CALL") {
      appendRound({
        at: Date.now(),
        pick: pickRef.current ?? "H",
        outcome: res === "WON" ? "correct" : "missed",
        minute: minuteRef.current ?? 0,
      });
    }
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
      const res: Result = resolvePick(pickRef.current ?? "H", scoredSide);
      after(FLASH_MS, () => finalize(res, scoredSide));
    },
    [after, clearTimers, finalize],
  );

  const lock = useCallback(() => {
    clearTimers();
    lockScore.current = score;
    setPhase("LOCKED");
    onLockRef.current(); // /play: harness schedules the store-owned goal · /terminal: no-op (reads the real goal)
    after(resolveWindowMs, () => resolve(null)); // no goal by the window → NO_CALL (or a "nobody" win)
  }, [after, clearTimers, resolve, resolveWindowMs, score]);

  // Resolve off the REAL goal WHILE LOCKED — the read-only mechanism (the same score delta the halt money-shot
  // writes via land()). Subscribe to RAW store emits, not React renders, so the halt's reset()→land() dip is
  // seen even under reduced motion (where render-time reads coalesce to the final frame). A score DROP below
  // the lock baseline is a rewind (the terminal Replay's reset), so re-arm to the new floor; the following
  // land() then reads as a fresh goal. `done` guards against the synchronous emit burst re-firing resolve.
  // /play never rewinds mid-round, so this is identical to before there.
  useEffect(() => {
    if (phase !== "LOCKED") return;
    let done = false;
    return subscribeMatch(TERMINAL_MATCH_ID, (s) => {
      const now = s?.score;
      if (done || !now) return;
      if (now.home < lockScore.current.home || now.away < lockScore.current.away) {
        lockScore.current = now;
        return;
      }
      const g = detectGoal(lockScore.current, now);
      if (g) {
        done = true;
        resolve(g);
      }
    });
  }, [phase, resolve]);

  const choose = useCallback(
    (side: Pick) => {
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
    match: { score, minute: live?.minute ?? null, status: live?.status ?? "LIVE", spark: live?.spark ?? [], sparkOutcome: live?.riverOutcome ?? "A" },
    choose,
    next,
  };
}
