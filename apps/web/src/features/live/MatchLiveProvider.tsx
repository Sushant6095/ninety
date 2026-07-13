"use client";
import { useEffect, type ReactNode } from "react";
import { driftTick } from "./matchLiveStore";

const TICK_MS = 1900;

/** Runs the single store drift loop for the whole app (mounted once in the root layout, so BOTH /terminal
 *  and the / board tick off the same beat). No state of its own — the store is the source of truth; this
 *  just advances it. Off under prefers-reduced-motion (the store then shows its calm seed frame). */
export function MatchLiveProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(driftTick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return <>{children}</>;
}
