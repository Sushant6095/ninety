"use client";
// Next Goal round history — GAMING-ONLY. A tiny localStorage-backed log of resolved rounds
// (correct/missed calls only; NO_CALL is a non-event) written by useNextGoalGame's finalize and
// read by the /play round filter. No accounts, no backend — same persistence posture as the
// streak stats (ADR-060). Immutable appends; useSyncExternalStore keeps readers in sync.
import { useSyncExternalStore } from "react";
import type { Pick } from "./nextGoalMachine";

export interface RoundRecord {
  /** Epoch ms at resolution — doubles as the id. */
  at: number;
  /** What the player called: H | A | N (nobody). */
  pick: Pick;
  outcome: "correct" | "missed";
  /** Match minute at resolution (0 when the feed had none). */
  minute: number;
}

export const ROUNDS_KEY = "ninety.nextgoal.rounds.v1";
const MAX_ROUNDS = 50; // enough history to filter; localStorage stays tiny

const EMPTY: RoundRecord[] = [];
let cache: RoundRecord[] | null = null;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): RoundRecord[] {
  if (!Array.isArray(raw)) return EMPTY;
  return raw
    .filter(
      (r): r is RoundRecord =>
        !!r &&
        typeof r === "object" &&
        Number.isFinite((r as RoundRecord).at) &&
        ((r as RoundRecord).outcome === "correct" || (r as RoundRecord).outcome === "missed"),
    )
    .slice(0, MAX_ROUNDS);
}

/** Newest first. Cached so useSyncExternalStore sees a stable snapshot between appends. */
export function loadRounds(): RoundRecord[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(ROUNDS_KEY);
    cache = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY; // corrupt/unavailable storage never blocks play
  }
  return cache;
}

export function appendRound(round: RoundRecord): void {
  if (typeof window === "undefined") return;
  const next = [round, ...loadRounds()].slice(0, MAX_ROUNDS); // immutable — never mutate the snapshot
  cache = next;
  try {
    window.localStorage.setItem(ROUNDS_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — the in-memory log still updates */
  }
  listeners.forEach((fn) => fn());
}

export function subscribeRounds(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** The resolved-rounds log, newest first — re-renders on every append. */
export function useRoundLog(): RoundRecord[] {
  return useSyncExternalStore(subscribeRounds, loadRounds, () => EMPTY);
}
