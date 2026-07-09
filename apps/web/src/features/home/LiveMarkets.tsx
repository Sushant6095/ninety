"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { MarketRow, Outcome } from "../../lib/types";

// ── Live simulation ────────────────────────────────────────────────────────────
// Fixtures don't move; a live exchange must. Until the real WS feed is wired (BLOCKED B2), this drifts each
// LIVE market's consensus a hair every tick, renormalizes to a valid distribution, and extends the momentum
// history — so prices flash and the River flows exactly as they will off the bus. Off under reduced-motion.

const TICK_MS = 1900;
const DRIFT = 0.014; // max per-tick nudge to a raw outcome weight before renormalizing
const r3 = (n: number): number => Math.round(n * 1000) / 1000;
const OUTCOMES: Outcome[] = ["H", "D", "A"];

function driftMark(mark: Record<Outcome, number>): Record<Outcome, number> {
  const raw = OUTCOMES.map((o) => Math.max(0.02, Math.min(0.96, mark[o] + (Math.random() - 0.5) * DRIFT)));
  const sum = raw[0] + raw[1] + raw[2];
  return { H: r3(raw[0] / sum), D: r3(raw[1] / sum), A: r3(raw[2] / sum) };
}

const LiveCtx = createContext<MarketRow[] | null>(null);

export function LiveMarketsProvider({ initial, children }: { initial: MarketRow[]; children: ReactNode }) {
  const [markets, setMarkets] = useState<MarketRow[]>(initial);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => {
          if (m.minute == null || !m.mark) return m; // only in-play markets move
          const mark = driftMark(m.mark as Record<Outcome, number>);
          const spark = [...m.spark.slice(-47), Math.round(mark.H * 1000) / 10];
          return { ...m, mark, spark };
        }),
      );
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return <LiveCtx.Provider value={markets}>{children}</LiveCtx.Provider>;
}

/** The live row for a match id, or null before the provider mounts (server render / no-JS). */
export function useLiveMarket(matchId: string): MarketRow | null {
  const markets = useContext(LiveCtx);
  return markets?.find((m) => m.matchId === matchId) ?? null;
}

/** The full live market array, or null before the provider mounts. */
export function useLiveMarkets(): MarketRow[] | null {
  return useContext(LiveCtx);
}

// ── LivePrice ────────────────────────────────────────────────────────────────
// A mono number that flashes up/down for one 220ms tick when its value changes (design law).

export function LivePrice({ value, decimals = 1, className = "" }: { value: number; decimals?: number; className?: string }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"" | "up" | "down">("");

  useEffect(() => {
    const p = prev.current;
    prev.current = value;
    if (value > p + 1e-6) setFlash("up");
    else if (value < p - 1e-6) setFlash("down");
    else return;
    const t = window.setTimeout(() => setFlash(""), 300);
    return () => window.clearTimeout(t);
  }, [value]);

  return (
    <span className={`num tabular-nums ${flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : ""} ${className}`}>
      {value.toFixed(decimals)}
    </span>
  );
}
