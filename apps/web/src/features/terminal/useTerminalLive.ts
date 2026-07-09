"use client";
import { useEffect, useRef, useState } from "react";
import type { Outcome } from "../../lib/types";

const TICK_MS = 1900;
const DRIFT = 0.012;
const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const OUT: Outcome[] = ["H", "D", "A"];

/** Drives the selected match live — drifts the mark (renormalized) each tick and extends the away-win% history,
 *  so the big River flows, the price cells flash, and the open-position P&L updates. Off under reduced motion. */
export function useTerminalLive(mark0: Record<Outcome, number>, spark0: number[]) {
  const [mark, setMark] = useState<Record<Outcome, number>>(mark0);
  const [spark, setSpark] = useState<number[]>(spark0);
  const markRef = useRef(mark0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const prev = markRef.current;
      const raw = OUT.map((o) => Math.max(0.02, Math.min(0.96, prev[o] + (Math.random() - 0.5) * DRIFT)));
      const s = raw[0] + raw[1] + raw[2];
      const next: Record<Outcome, number> = { H: r3(raw[0] / s), D: r3(raw[1] / s), A: r3(raw[2] / s) };
      markRef.current = next;
      setMark(next);
      setSpark((sp) => [...sp.slice(-79), Math.round(next.A * 1000) / 10]);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return { mark, spark };
}
