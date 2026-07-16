"use client";
// The persistent tally (ADR-060) — streak pips, points, best. localStorage-backed via the hook's stats.
// Numbers are mono/tabular (design law). Pips fill green as the streak climbs; the count pops on change.
// Zero-state pips are unlit-but-ALIVE (design-cop 2026-07-16 gap 5): hairline rings, not filled discs
// (filled gray read as disabled UI), and the first pip breathes on opacity while there's no streak.
import { motion, useReducedMotion } from "framer-motion";
import type { GameStats } from "./nextGoalMachine";

const PIPS = 5;

export function StreakRail({ stats }: { stats: GameStats }) {
  const lit = Math.min(stats.streak, PIPS);
  const reduce = useReducedMotion();
  return (
    <div className="flex items-center justify-between border-t border-hairline/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-label font-semibold uppercase tracking-[0.1em] text-lo">Streak</span>
        <span className="flex items-center gap-1" role="img" aria-label={`Streak ${stats.streak}`}>
          {Array.from({ length: PIPS }, (_, i) => (
            <motion.span
              key={i}
              animate={{
                backgroundColor: i < lit ? "var(--up)" : "transparent",
                scale: 1,
                opacity: i < lit ? 1 : lit === 0 && i === 0 && !reduce ? [0.35, 0.85, 0.35] : 0.7,
              }}
              transition={
                i < lit
                  ? { type: "spring", duration: 0.3, bounce: 0.15 }
                  : lit === 0 && i === 0 && !reduce
                    ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2 }
              }
              className={`h-2 w-2 rounded-full ${i < lit ? "" : "ring-1 ring-inset ring-hairline"}`}
            />
          ))}
          {stats.streak > PIPS && <span className="num ml-0.5 text-caption font-semibold text-up">+{stats.streak - PIPS}</span>}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Stat label="Best" value={stats.best} />
        <Stat label="Points" value={stats.points} accent />
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-label font-semibold uppercase tracking-[0.1em] text-lo">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`num text-strong font-bold tabular-nums ${accent ? "text-up" : "text-hi"}`}
      >
        {value.toLocaleString("en-US")}
      </motion.span>
    </span>
  );
}
