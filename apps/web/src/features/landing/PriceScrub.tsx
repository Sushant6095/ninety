"use client";
import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";
import { motion as m } from "../../design/motion";

void ScrollTrigger; // registered in lib/gsap.ts; referenced so the plugin ships with this island

/** The giant 61.4 — ScrollTrigger fires a one-shot count 0→61.4 over `motion.count` on the ninety ease
 *  as the section enters (the brief's scroll choreography). Until the trigger fires — SSR, no-JS,
 *  reduced-motion, full-page stills — the DOM holds the final 61.4, so the number never argues with
 *  its caption at rest. (Not scrubbed: a scrub's progress-0 frame would paint 0.0 on any unscrolled load.) */
export function PriceScrub({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { v: 0 };
        gsap.to(counter, {
          v: 61.4,
          duration: m.count / 1000,
          ease: "ninety",
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
          onUpdate: () => {
            el.textContent = counter.v.toFixed(1);
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={`num inline-block tabular-nums ${className}`}>
      61.4
    </span>
  );
}
