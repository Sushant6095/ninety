"use client";
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";
import { motion as m } from "../../design/motion";

void ScrollTrigger; // registered in lib/gsap.ts; referenced so the plugin ships with this island

// Arrival storyboard (per section, on scroll-enter, once):
//   t=0      the section's [data-arrive-item] children rise in — slow 250ms each on the ninety ease
//   +45ms…   each subsequent item cascades at heroStagger (30–80ms band; decorative, never blocking)
const ARRIVE = { start: "top 82%", y: 14 } as const;

/** Section arrival choreography for the landing ONLY (never the board, never /terminal). Each
 *  [data-arrive] section rises in once as it enters; [data-arrive-item] children cascade. Tokens
 *  only, transform/opacity only; reduced motion → everything visible instantly, no travel
 *  (motion.md: motion is feedback and information, not entertainment). */
export function LandingScroll({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-arrive]").forEach((el) => {
          const items = el.querySelectorAll<HTMLElement>("[data-arrive-item]");
          gsap.from(items.length ? items : el, {
            opacity: 0,
            y: ARRIVE.y,
            duration: m.slow / 1000,
            stagger: m.heroStagger / 1000,
            ease: "ninety",
            scrollTrigger: { trigger: el, start: ARRIVE.start, once: true },
          });
        });
      });
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
