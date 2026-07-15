"use client";
import { useReducedMotion } from "framer-motion";
import { Marquee } from "../../components/vendor/magicui/marquee";

// The velocity band — the product loop as a typographic chapter break between the price story and
// the proof story. Rides the CSS marquee keyframes (compositor-only), NOT scroll-linked JS: the
// scroll-velocity variant added a per-frame rAF scroll read + a static will-change row, and the
// live MotionScore gate measured desktop thrashing C→D — performance beats the flourish (the cut
// is logged in PROVENANCE). Decorative (aria-hidden — the same four verbs are real copy elsewhere).
// Reduced motion → one static centered row, no loop at all.

const WORDS = ["price", "trade", "settle", "prove"] as const;

function BandRow() {
  return (
    // /70 not /30: axe checks contrast on visually-rendered text even under aria-hidden — 48px bold
    // needs ≥3:1 on --bg (/50 measured 2.67, /70 ≈ 4:1 with margin) and it still whispers vs full lo.
    <span className="font-display text-section font-bold text-lo/70">
      {WORDS.map((w) => (
        <span key={w} className="inline-block px-7">
          {w}
          <span aria-hidden className="pl-14 text-lo/30">
            ·
          </span>
        </span>
      ))}
    </span>
  );
}

export function VelocityBand() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="select-none overflow-hidden border-b border-hairline py-5">
      {reduce ? (
        <div className="flex justify-center whitespace-nowrap">
          <BandRow />
        </div>
      ) : (
        <Marquee className="[--marquee-duration:48s] [--marquee-gap:0px]" repeat={3}>
          <BandRow />
        </Marquee>
      )}
    </div>
  );
}
