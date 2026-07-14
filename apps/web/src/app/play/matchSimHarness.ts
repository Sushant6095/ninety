"use client";
// The /play feed harness (ADR-057) — the PAGE's stand-in for the live WS feed, and the ONLY thing in /play
// that writes match state. It writes exclusively through the store's OWN writers (the same setScore /
// repriceMatch / rewindMatch that useHaltSequence uses to land the money-shot goal). The Next Goal game
// never sees this file — it only reads the resulting score delta. Swap in a real feed = delete this hook;
// the game code does not change. That separation is the proof the game is read-only.
import { useCallback, useEffect, useRef } from "react";
import { setScore, repriceMatch, rewindMatch, TERMINAL_MATCH_ID } from "../../features/live/matchLiveStore";

const FIRE_MIN_MS = 700; // a goal feels reactive after the lock, not instant …
const FIRE_MAX_MS = 1500; // … and always lands inside the game's 2200ms NO_CALL window
const NO_CALL_P = 0.15; // sometimes the window passes with no goal — a real, unpunished outcome
const HOME_POST = 64; // the scoring side's win% jump (mirrors the money-shot 31→55 reprice)
const AWAY_POST = 55;

/** @returns armGoal — schedule a store-owned goal after a lock; resetMatch — rewind to the 0–0/74' seed. */
export function useMatchSimHarness(): { armGoal: () => void; resetMatch: () => void } {
  const fireTimer = useRef(0);

  const clearFire = useCallback(() => {
    window.clearTimeout(fireTimer.current);
    fireTimer.current = 0;
  }, []);

  const resetMatch = useCallback(() => {
    clearFire();
    rewindMatch(TERMINAL_MATCH_ID); // back to the seed: 74', 0–0, prices at open
  }, [clearFire]);

  const armGoal = useCallback(() => {
    clearFire();
    const delay = FIRE_MIN_MS + Math.random() * (FIRE_MAX_MS - FIRE_MIN_MS);
    fireTimer.current = window.setTimeout(() => {
      if (Math.random() < NO_CALL_P) return; // no goal this window → the game resolves NO_CALL on its own timer
      if (Math.random() < 0.5) {
        repriceMatch(TERMINAL_MATCH_ID, "H", HOME_POST);
        setScore(TERMINAL_MATCH_ID, { home: 1, away: 0 });
      } else {
        repriceMatch(TERMINAL_MATCH_ID, "A", AWAY_POST);
        setScore(TERMINAL_MATCH_ID, { home: 0, away: 1 });
      }
    }, delay);
  }, [clearFire]);

  // start clean, and never strand the shared demo match at 1–0 when leaving /play
  useEffect(() => {
    rewindMatch(TERMINAL_MATCH_ID);
    return () => {
      clearFire();
      rewindMatch(TERMINAL_MATCH_ID);
    };
  }, [clearFire]);

  return { armGoal, resetMatch };
}
