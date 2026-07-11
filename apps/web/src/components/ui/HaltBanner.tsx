"use client";
import { motion, useReducedMotion } from "framer-motion";

interface HaltBannerProps {
  reason?: string; // "Goal under review" | "VAR check" …
}

/** Amber halt banner with a slow compositor-only sweep. Amber is the halt token — used here and nowhere
 *  decorative. Trading is paused while this shows; honors prefers-reduced-motion (no sweep). */
export function HaltBanner({ reason = "Trading paused — prices frozen" }: HaltBannerProps) {
  const reduce = useReducedMotion();
  return (
    <div role="status" className="relative overflow-hidden border-y border-halt/40 bg-halt/10 px-4 py-2.5">
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-halt/15"
          initial={{ x: 0 }}
          animate={{ x: "500%" }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          style={{ filter: "blur(8px)" }}
        />
      )}
      <div className="relative flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-halt" />
        <span className="text-label font-semibold uppercase tracking-[0.12em] text-halt">Market halted</span>
        <span className="text-caption text-hi/80">{reason}</span>
      </div>
    </div>
  );
}
