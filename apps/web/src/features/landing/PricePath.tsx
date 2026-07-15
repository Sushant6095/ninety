"use client";
import { useRef } from "react";
import { useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ScrollLinePath } from "../../components/vendor/skiper/skiper19";

// The scroll-drawn price path (skiper19 primitive, re-skinned) — a thin price-like line that draws
// itself down the landing's story margin as the visitor scrolls. Framer useScroll drives it (per
// ADR-052's split this is a micro/scroll-linked value, and it deliberately does NOT touch the GSAP
// ScrollTriggers that LandingScroll owns). Decorative: aria-hidden, pointer-events-none, wide
// screens only (2xl) so it never crowds the 1180px content column. Reduced motion → the path rests
// fully drawn, nothing moves on scroll.

// A price tape, vertically: drifts, repricings, one big swing — drawn top to bottom.
const PATH_D =
  "M60 0 L60 64 L44 122 L76 196 L56 258 L64 330 L38 412 L84 472 L60 540 L52 622 L88 704 L46 792 L72 862 L58 932 L78 1012 L52 1092 L60 1200";

export function PricePath({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // A light spring so the stroke eases after the wheel stops — velocity-aware, no scrub judder.
  const drawn = useSpring(scrollYProgress, { stiffness: 90, damping: 24, restDelta: 0.001 });

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <ScrollLinePath
        progress={reduce ? 1 : drawn}
        d={PATH_D}
        viewBox="0 0 120 1200"
        strokeWidth={1.5}
        className="absolute left-6 top-0 h-full w-[110px] opacity-40"
      />
    </div>
  );
}
