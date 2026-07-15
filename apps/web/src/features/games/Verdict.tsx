"use client";
// The payoff surface (ADR-060) — the ~1s snappy resolve after the slow countdown. GSAP choreographs the
// win burst (heavy motion, ADR-052); Framer handles the panel pop and the count-up. Celebration is EARNED:
// a 3-streak throws more beams, a bigger pop, more glow than a 2. LOST never punishes — quiet, muted,
// "so close", points kept. Reduced motion drops every beam and pop, keeps opacity + color.
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gsap, useGSAP } from "../../lib/gsap";
import { awardFor, type GameStats, type Result, type Side } from "./nextGoalMachine";

// per-tier escalation — intensity, not hue (up-green stays the win semantic; design law reserves halt/chain)
const BEAMS = [0, 6, 8, 10, 14] as const;
const BEAM_LEN = [0, 40, 52, 64, 76] as const;
const POP = [1, 1.05, 1.08, 1.12, 1.16] as const;
const TIER_LABEL = ["", "Nice pick", "Two in a row", "On a roll", "On fire"] as const;

interface Team {
  code: string;
  name: string;
}

export function Verdict({
  result,
  scored,
  tier,
  stats,
  home,
  away,
  onNext,
}: {
  result: Result;
  scored: Side | null;
  tier: 0 | 1 | 2 | 3 | 4;
  stats: GameStats;
  home: Team;
  away: Team;
  onNext: () => void;
}) {
  const reduce = useReducedMotion();
  const won = result === "WON";
  const scorer = scored === "H" ? home : scored === "A" ? away : null;
  const award = won ? awardFor(stats.streak) : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        initial={{ opacity: 0, scale: reduce ? 1 : 0.9 }}
        animate={{ opacity: 1, scale: won && !reduce ? POP[tier] : 1 }}
        transition={won ? { type: "spring", duration: 0.5, bounce: 0.28 } : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex min-h-[128px] w-full flex-col items-center justify-center"
      >
        {won && <WinBurst tier={tier} reduce={!!reduce} />}

        {won ? (
          <>
            <span className="relative z-10 font-display text-heading font-extrabold uppercase tracking-[0.12em] text-up">
              {scorer ? `Goal · ${scorer.code}` : "Called it · no goal"}
            </span>
            <CountUp value={award} reduce={!!reduce} />
            <StreakBadge streak={stats.streak} label={TIER_LABEL[tier]} />
          </>
        ) : result === "LOST" ? (
          <>
            <span className="font-display text-heading font-bold tracking-tight text-hi">So close.</span>
            <span className="mt-1 text-caption text-lo">
              {scorer?.code} scored — streak reset, <span className="text-hi">points safe</span>
            </span>
          </>
        ) : (
          <>
            <span className="font-display text-heading font-bold tracking-tight text-hi">No goal that window</span>
            <span className="mt-1 text-caption text-lo">
              Streak <span className="text-up">safe</span> · call it again
            </span>
          </>
        )}
      </motion.div>

      <motion.button
        type="button"
        onClick={onNext}
        autoFocus
        whileTap={{ scale: 0.97 }}
        className="elev flex min-h-[44px] w-full items-center justify-center rounded-card border border-hairline/70 bg-surface px-4 py-3 text-strong font-semibold text-hi outline-none transition-colors duration-200 hover:border-hairline focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        Go again
      </motion.button>
    </div>
  );
}

/** Radiating beams — GSAP grows them outward (scaleY) with a stagger, then fades. Token-green only. */
function WinBurst({ tier, reduce }: { tier: 0 | 1 | 2 | 3 | 4; reduce: boolean }) {
  const scope = useRef<HTMLDivElement>(null);
  const count = BEAMS[tier];
  const len = BEAM_LEN[tier];

  useGSAP(
    () => {
      if (reduce) return; // reduced motion: no beams, no glow travel
      const beams = gsap.utils.toArray<HTMLElement>(".ng-beam", scope.current);
      const glow = scope.current?.querySelector(".ng-glow");
      const tl = gsap.timeline();
      if (glow) {
        tl.fromTo(glow, { scale: 0.4, autoAlpha: 0 }, { scale: 1, autoAlpha: 0.9, duration: 0.14, ease: "power2.out" }, 0)
          .to(glow, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }, 0.16);
      }
      tl.fromTo(
        beams,
        { scaleY: 0, autoAlpha: 0 },
        { scaleY: 1, autoAlpha: 0.9, duration: 0.28, ease: "power3.out", stagger: 0.04 },
        0.02,
      ).to(beams, { autoAlpha: 0, duration: 0.4, ease: "power1.out", stagger: 0.02 }, 0.3);
    },
    { scope, dependencies: [] },
  );

  return (
    <div ref={scope} aria-hidden className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
      <div className="ng-glow absolute h-16 w-16 rounded-full bg-up opacity-0 shadow-[0_0_40px_var(--up)]" />
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="ng-beam absolute left-1/2 top-1/2 w-[3px] rounded-full bg-up opacity-0"
          style={{
            height: len,
            transform: `translate(-50%, -100%) rotate(${(360 / count) * i}deg)`,
            transformOrigin: "50% 100%",
          }}
        />
      ))}
    </div>
  );
}

/** The awarded points, counting up from zero over ~500ms (emil count token). Mono, tabular. */
function CountUp({ value, reduce }: { value: number; reduce: boolean }) {
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) {
      setN(value);
      return;
    }
    const start = performance.now();
    const DUR = 500;
    let raf = 0;
    const step = (t: number): void => {
      const p = Math.min(1, (t - start) / DUR);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);

  return (
    <span className="num relative z-10 mt-1 font-display text-display-xl font-extrabold leading-none tabular-nums text-up">
      +{n}
    </span>
  );
}

function StreakBadge({ streak, label }: { streak: number; label: string }) {
  return (
    <span className="relative z-10 mt-2 inline-flex items-center gap-2 rounded-chip border border-up/40 bg-up/10 px-3 py-1">
      <span className="num text-strong font-bold text-up">{streak}×</span>
      <span className="text-label font-semibold uppercase tracking-[0.1em] text-lo">streak · {label}</span>
    </span>
  );
}
