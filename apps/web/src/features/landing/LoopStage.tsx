"use client";
import { useEffect, useRef, useState } from "react";
import { FeaturedPanel } from "../home/FeaturedPanel";
import { useMatchLive } from "../live/matchLiveStore";
import { MARKETS } from "../../lib/fixtures";

const FEATURED = MARKETS.find((m) => m.matchId === "wc26-can-mar") ?? MARKETS[0];

const LOOP_STEPS = [
  { label: "Goal", halt: false },
  { label: "Halt", halt: true },
  { label: "Reprice", halt: false },
  { label: "The Booth", halt: false },
  { label: "Settle", halt: false },
] as const;

/** The loop legend, wired to the SAME match store the panel writes: when the featured market halts,
 *  the amber HALT chip ignites and the quiet steps recede — the diagram and the product beat as one. */
export function LoopLegend() {
  const live = useMatchLive(FEATURED.matchId);
  const halted = live?.status === "HALTED";
  return (
    <ol className="mt-8 flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="The market loop">
      {LOOP_STEPS.map((s, i) => (
        <li key={s.label} className="flex items-center gap-x-1">
          <span
            className={`num rounded-md px-2 py-1 text-label font-semibold uppercase tracking-[0.14em] ring-1 ring-inset transition-colors duration-200 ${
              s.halt
                ? halted
                  ? "bg-halt/25 text-halt ring-halt/80"
                  : "bg-halt/10 text-halt ring-halt/40"
                : `bg-surface ring-hairline ${halted ? "text-lo/80" : "text-lo"}`
            }`}
          >
            {s.label}
          </span>
          {i < LOOP_STEPS.length - 1 && <span aria-hidden className="px-0.5 text-label text-lo">→</span>}
        </li>
      ))}
    </ol>
  );
}

/** The REAL product moment on the landing: the same FeaturedPanel (and the same useHaltSequence
 *  timeline + match store) the board runs. Mounted only when scrolled into view so its one-shot
 *  halt choreography plays in front of the visitor, not offscreen. Fixed min-height kills CLS. */
export function LoopStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLive(true);
          io.disconnect();
        }
      },
      { rootMargin: "-15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="min-h-[330px] w-full">
      {live ? (
        <FeaturedPanel market={FEATURED} />
      ) : (
        <div aria-hidden className="h-[330px] w-full animate-pulse rounded-card border border-hairline/70 bg-surface motion-reduce:animate-none" />
      )}
    </div>
  );
}
