"use client";
// The persistent tally (ADR-060) — streak pips, points, best. localStorage-backed via the hook's stats.
// Numbers are mono/tabular (design law). Pips fill green as the streak climbs; the count pops on change.
import { motion } from "framer-motion";
import type { GameStats } from "./nextGoalMachine";

const PIPS = 5;

export function StreakRail({ stats }: { stats: GameStats }) {
  const lit = Math.min(stats.streak, PIPS);
  return (
    <div className="flex items-center justify-between border-t border-hairline/60 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-label font-semibold uppercase tracking-[0.1em] text-lo">Streak</span>
        <span className="flex items-center gap-1" aria-label={`Streak ${stats.streak}`}>
          {Array.from({ length: PIPS }, (_, i) => (
            <motion.span
              key={i}
              animate={{
                backgroundColor: i < lit ? "var(--up)" : "var(--hairline)",
                scale: i < lit ? 1 : 0.82,
              }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
              className="h-2 w-2 rounded-full"
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
