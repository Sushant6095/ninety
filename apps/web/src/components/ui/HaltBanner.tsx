"use client";
import { motion as m, useReducedMotion } from "framer-motion";
import mo from "../../design/motion";

interface HaltBannerProps {
  reason?: string; // "Goal under review" | "VAR check" …
}

/** Amber halt banner — the FREEZE beat of the halt choreography. It mounts when the market goes HALTED and
 *  slides in as isolated state motion (translateY -8→0, opacity 0→1, one element, Framer): the GSAP timeline
 *  never touches it, so no element is animated by two engines. Amber is the halt token — used here and nowhere
 *  decorative. A slow compositor-only sweep runs while trading is paused; honors prefers-reduced-motion (no travel). */
export function HaltBanner({ reason = "Trading paused — prices frozen" }: HaltBannerProps) {
  const reduce = useReducedMotion();
  return (
    <m.div
      role="status"
      className="relative overflow-hidden border-y border-halt/40 bg-halt/10 px-4 py-2.5"
      initial={{ opacity: 0, y: reduce ? 0 : -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: (reduce ? mo.reduced.duration * 1000 : mo.transition) / 1000, ease: mo.easeOut }}
    >
      {!reduce && (
        <m.span
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
        <span className="text-label font-semibold uppercase tracking-label text-halt">Market halted</span>
        <span className="text-caption text-hi/80">{reason}</span>
      </div>
    </m.div>
  );
}
