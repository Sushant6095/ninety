"use client";
// Next Goal (ADR-060) — the read-only orchestrator. Reads the live match (moving) from the store via the
// hook and the team metadata (still) from MATCH. Swaps the decision surface (PickPad) for the payoff
// (Verdict). Writes ZERO match state; the goal is produced by the page harness through onLock/onReset.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Flag } from "../../components/ui/Flag";
import { MATCH } from "../../lib/terminal";
import { PickPad } from "./PickPad";
import { Verdict } from "./Verdict";
import { StreakRail } from "./StreakRail";
import { useNextGoalGame } from "./useNextGoalGame";
import type { Result } from "./nextGoalMachine";

const HOME = { code: MATCH.homeCode, name: MATCH.home };
const AWAY = { code: MATCH.awayCode, name: MATCH.away };
const TERMINAL: Result[] = ["WON", "LOST", "NO_CALL"];

/** @param onLock/onReset  round lifecycle events. /play turns them into store-owned goals via its harness;
 *                         /terminal passes no-ops (read-only — the game reads the REAL halt goal, ADR-061).
 *  @param nobody          add the "nobody" third pick (terminal variant). @param resolveWindowMs  lock→NO_CALL wait. */
export function NextGoal({
  onLock,
  onReset,
  nobody = false,
  resolveWindowMs,
}: {
  onLock: () => void;
  onReset: () => void;
  nobody?: boolean;
  resolveWindowMs?: number;
}) {
  const reduce = useReducedMotion();
  const g = useNextGoalGame(onLock, onReset, { resolveWindowMs });
  const resolved = TERMINAL.includes(g.phase as Result);
  const halted = g.match.status === "HALTED";
  const prompt = nobody ? `Who scores next — ${HOME.name}, ${AWAY.name}, or nobody?` : undefined;

  return (
    <section
      aria-label="Next Goal — a quick call on who scores next"
      className="elev-hi w-full max-w-sm overflow-hidden rounded-card border border-hairline/70 bg-surface"
    >
      {/* eyebrow */}
      <div className="flex items-center justify-between border-b border-hairline/60 px-4 py-2.5">
        <span className="text-label font-bold uppercase tracking-[0.16em] text-hi">Next Goal</span>
        <span className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Free to play</span>
      </div>

      {/* live match strip (read-only: minute/score/phase from the store) */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2">
          <Flag code={HOME.code} size={26} />
          <span className="text-strong font-semibold text-hi">{HOME.code}</span>
        </span>
        <span className="flex flex-col items-center">
          <span className={`num inline-flex items-center gap-1 text-label font-semibold ${halted ? "text-halt" : "text-up"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${halted ? "bg-halt" : "bg-up shadow-[0_0_6px_var(--up)]"}`} />
            {halted ? "HALT" : "LIVE"} {g.match.minute}&#39;
          </span>
          <span className="num mt-0.5 font-display text-display font-extrabold tabular-nums text-hi">
            {g.match.score.home}<span className="px-1 text-lo">–</span>{g.match.score.away}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-strong font-semibold text-hi">{AWAY.code}</span>
          <Flag code={AWAY.code} size={26} />
        </span>
      </div>

      {/* the swap: decision ⇄ payoff. aria-live announces the verdict. min-height avoids layout jump. */}
      <div className="min-h-[292px] px-4 pb-2 pt-1" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolved ? "verdict" : "pick"}
            initial={{ opacity: 0, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {resolved ? (
              <Verdict
                result={g.phase as Result}
                scored={g.scored}
                tier={g.tier}
                stats={g.stats}
                home={HOME}
                away={AWAY}
                onNext={g.next}
              />
            ) : (
              <PickPad phase={g.phase} pick={g.pick} pickStartedAt={g.pickStartedAt} home={HOME} away={AWAY} onPick={g.choose} nobody={nobody} prompt={prompt} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <StreakRail stats={g.stats} />
    </section>
  );
}
