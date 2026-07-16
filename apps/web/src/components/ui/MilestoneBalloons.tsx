"use client";
// Milestone balloons — /play only (never a live-price surface). Fires balloons-js textBalloons
// when the BEST Next-Goal streak crosses 5 (then 10), computed from the round log (READ-ONLY).
// One-shot per milestone via localStorage; the lib loads lazily at fire time so it never sits
// in the shared bundle; prefers-reduced-motion users never get it. Colors are resolved at
// runtime from the live token values (--up / --text-hi) — streaks are local play stats, NOT
// on-chain, so no chain violet. Copy is joy-only: "in a row", never anything cash-shaped.

import { useEffect } from "react";
import { useRoundLog, type RoundRecord } from "@/features/games/roundLog";

const MILESTONES = [5, 10] as const;

function storageKey(milestone: number): string {
  return `ninety:balloons:${milestone}`;
}

/** Longest run of consecutive correct calls; the log arrives newest-first, so walk it backwards. */
function bestStreak(rounds: readonly RoundRecord[]): number {
  let best = 0;
  let run = 0;
  for (let i = rounds.length - 1; i >= 0; i -= 1) {
    run = rounds[i]!.outcome === "correct" ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

function readToken(style: CSSStyleDeclaration, name: string): string {
  // Runtime-resolved token value handed to the lib — not a hardcoded color.
  return style.getPropertyValue(name).trim() || "currentColor";
}

export function MilestoneBalloons() {
  const rounds = useRoundLog();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const best = bestStreak(rounds);
    const due = MILESTONES.filter((m) => {
      if (best < m) return false;
      try {
        return window.localStorage.getItem(storageKey(m)) === null;
      } catch {
        return false; // storage unavailable → can't guarantee one-shot, so don't fire
      }
    });
    const milestone = due[due.length - 1];
    if (milestone === undefined) return;

    for (const m of due) {
      try {
        window.localStorage.setItem(storageKey(m), String(Date.now()));
      } catch {
        return; // same posture: no one-shot guarantee, no fire
      }
    }

    const style = getComputedStyle(document.documentElement);
    const up = readToken(style, "--up");
    const hi = readToken(style, "--text-hi");

    void import("balloons-js").then(({ textBalloons }) => {
      textBalloons([
        { text: "⚽", color: up, fontSize: 110 },
        { text: `${milestone} in a row`, color: hi, fontSize: 72 }
      ]);
    });
  }, [rounds]);

  return null;
}
