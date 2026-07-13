"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Outcome } from "../../lib/types";

const TICK_MS = 1900;
const DRIFT = 0.012;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const OUT: Outcome[] = ["H", "D", "A"];

/** Drives the selected match live — drifts the mark (renormalized) each tick and extends the away-win% history,
 *  so the big River flows, the price cells flash, and the open-position P&L updates. Off under reduced motion.
 *  `freeze(true)` pauses the drift (a halt); `reprice(awayPct)` is the single controlled value change the halt
 *  choreography uses to step the away-win% (the cliff) — one setMark + one appended River point, no re-render storm. */
export function useTerminalLive(mark0: Record<Outcome, number>, spark0: number[], homeSpark0: number[]) {
  const [mark, setMark] = useState<Record<Outcome, number>>(mark0);
  const [spark, setSpark] = useState<number[]>(spark0);
  const [homeSpark, setHomeSpark] = useState<number[]>(homeSpark0);
  const markRef = useRef(mark0);
  const frozenRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (frozenRef.current) return; // drift paused while a halt is in progress
      const prev = markRef.current;
      const raw = OUT.map((o) => Math.max(0.02, Math.min(0.96, prev[o] + (Math.random() - 0.5) * DRIFT)));
      const s = raw[0] + raw[1] + raw[2];
      const next: Record<Outcome, number> = { H: r3(raw[0] / s), D: r3(raw[1] / s), A: r3(raw[2] / s) };
      markRef.current = next;
      setMark(next);
      // Extend both win-% traces from the same tick so the EGY area and the AUS context line stay in lockstep.
      setSpark((sp) => [...sp.slice(-79), Math.round(next.A * 1000) / 10]);
      setHomeSpark((sp) => [...sp.slice(-79), Math.round(next.H * 1000) / 10]);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const freeze = useCallback((on: boolean) => {
    frozenRef.current = on;
  }, []);

  // Re-anchor the away-win% to an explicit level (the reprice off a halt) — MARK ONLY, so the price cells + tags
  // tick-flash but the chart canvas is NOT touched. The cliff draws on as an SVG overlay; the canvas catches up
  // later via settleChart. H/D absorb the remainder in proportion to their current split (valid distribution).
  const repriceCells = useCallback((awayPct: number) => {
    const a = Math.max(0.02, Math.min(0.97, awayPct / 100));
    const prev = markRef.current;
    const restNow = prev.H + prev.D || 1e-6;
    const rest = 1 - a;
    const next: Record<Outcome, number> = { H: r3(rest * (prev.H / restNow)), D: r3(rest * (prev.D / restNow)), A: r3(a) };
    markRef.current = next;
    setMark(next);
  }, []);

  // Settle the chart to the mark AFTER the SVG cliff has drawn on — ONE appended point, the single controlled
  // canvas update (never a re-render storm). Uses the already-repriced mark so both traces stay in lockstep.
  const settleChart = useCallback((awayPct: number) => {
    const a = Math.max(0.02, Math.min(0.97, awayPct / 100));
    setSpark((sp) => [...sp.slice(-79), Math.round(a * 1000) / 10]);
    setHomeSpark((sp) => [...sp.slice(-79), Math.round(markRef.current.H * 1000) / 10]);
  }, []);

  return { mark, spark, homeSpark, freeze, repriceCells, settleChart };
}
