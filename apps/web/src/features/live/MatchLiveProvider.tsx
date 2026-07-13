"use client";
import { useEffect, type ReactNode } from "react";
import { driftTick, minuteTick } from "./matchLiveStore";

const PRICE_MS = 1900; // prices move within the current minute — fast enough to read as a live book
const MINUTE_MS = 15000; // …and the match clock advances a minute at a demo pace, not a real 60s

/** Runs the store's two beats for the whole app (mounted once in the root layout, so BOTH /terminal and the
 *  / board tick off the same clock). No state of its own — the store is the source of truth; this advances it.
 *  Off under prefers-reduced-motion (the store then holds its calm seed frame). */
export function MatchLiveProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const price = window.setInterval(driftTick, PRICE_MS);
    const clock = window.setInterval(minuteTick, MINUTE_MS);
    return () => {
      window.clearInterval(price);
      window.clearInterval(clock);
    };
  }, []);

  return <>{children}</>;
}
