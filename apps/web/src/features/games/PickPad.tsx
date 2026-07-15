"use client";
// The decision surface (ADR-060, extended by ADR-061): the focal countdown + the big, 2-second-legible pick
// buttons. Two picks on /play; three on /terminal (home · away · nobody). Framer Motion owns the
// micro-interactions (press scale(0.97), selection spring); the countdown ring drains via a CSS transition on
// stroke-dashoffset (precedented by the River cliff draw-on). Slow and deliberate by design — the countdown IS
// the tension. Reduced motion drops the drain, keeps the number.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { PICK_MS, type Phase, type Pick, type Side } from "./nextGoalMachine";

const R = 54;
const C = 2 * Math.PI * R;
const TICK_MS = 100;
const DEFAULT_PROMPT = (
  <>
    Who scores
    <br />
    next?
  </>
);

interface Team {
  code: string;
  name: string;
}

export function PickPad({
  phase,
  pick,
  pickStartedAt,
  home,
  away,
  onPick,
  nobody = false,
  prompt = DEFAULT_PROMPT,
}: {
  phase: Phase;
  pick: Pick | null;
  pickStartedAt: number | null;
  home: Team;
  away: Team;
  onPick: (side: Pick) => void;
  nobody?: boolean; // three-pick terminal variant — adds the "nobody / no goal" call (ADR-061)
  prompt?: ReactNode; // READY-state question; the terminal passes the full "…home, away, or nobody?" line
}) {
  const reduce = useReducedMotion();
  const picking = phase === "PICKING";
  const locked = phase === "LOCKED";
  const active = picking || locked;

  // drain the ring once when a countdown starts; a side-switch must NOT restart it
  const [draining, setDraining] = useState(false);
  const [remaining, setRemaining] = useState(3);
  const raf = useRef(0);
  useEffect(() => {
    if (pickStartedAt == null) {
      setDraining(false);
      setRemaining(3);
      return;
    }
    raf.current = requestAnimationFrame(() => setDraining(true)); // let offset:0 paint, then transition to C
    const id = window.setInterval(() => {
      const left = Math.max(0, PICK_MS - (Date.now() - pickStartedAt));
      setRemaining(Math.ceil(left / 1000));
    }, TICK_MS);
    return () => {
      cancelAnimationFrame(raf.current);
      window.clearInterval(id);
    };
  }, [pickStartedAt]);

  const ringOffset = locked ? 0 : draining ? C : 0;
  const ringColor = locked ? "var(--up)" : "var(--text-hi)";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ── focal: prompt (READY) or countdown (PICKING/LOCKED). READY takes full width so a longer terminal
           question wraps cleanly; the countdown circle stays a fixed 128px. ── */}
      <div className={`relative flex items-center justify-center ${active ? "h-[128px] w-[128px]" : "min-h-[128px] w-full px-2"}`}>
        {active ? (
          <>
            <svg viewBox="0 0 128 128" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="64" cy="64" r={R} fill="none" stroke="var(--hairline)" strokeWidth="6" />
              <circle
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={ringOffset}
                style={{
                  transition: reduce || locked ? "none" : `stroke-dashoffset ${PICK_MS}ms linear`,
                  filter: locked ? "drop-shadow(0 0 6px var(--up))" : "none",
                }}
              />
            </svg>
            <motion.div
              key={locked ? "locked" : "picking"}
              initial={{ opacity: 0, scale: reduce ? 1 : 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              {locked ? (
                <>
                  <motion.span
                    animate={reduce ? {} : { scale: [1, 1.06, 1] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                    className="h-2.5 w-2.5 rounded-full bg-up shadow-[0_0_8px_var(--up)]"
                  />
                  <span className="mt-2 text-label font-semibold uppercase tracking-[0.14em] text-lo">Locked</span>
                </>
              ) : (
                <>
                  <span className="num font-display text-display-xl font-extrabold leading-none tabular-nums text-hi">
                    {remaining}
                  </span>
                  <span className="mt-1 text-label font-semibold uppercase tracking-[0.14em] text-lo">Locking in</span>
                </>
              )}
            </motion.div>
          </>
        ) : (
          <motion.h2
            key="ask"
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-center font-display text-heading font-extrabold leading-tight tracking-tight text-hi"
          >
            {prompt}
          </motion.h2>
        )}
      </div>

      {/* ── the picks ── */}
      <div className="flex w-full flex-col gap-3" role="group" aria-label="Pick who scores the next goal">
        <div className="grid grid-cols-2 gap-3">
          <PickButton team={home} role="Home" side="H" pick={pick} active={active} locked={locked} reduce={!!reduce} onPick={onPick} />
          <PickButton team={away} role="Away" side="A" pick={pick} active={active} locked={locked} reduce={!!reduce} onPick={onPick} />
        </div>
        {nobody && <NobodyButton pick={pick} active={active} locked={locked} reduce={!!reduce} onPick={onPick} />}
      </div>
      <p className="min-h-[1rem] text-center text-caption text-lo">
        {locked
          ? "Watching the match…"
          : picking
            ? "Tap another to switch · tap yours to lock now"
            : nobody
              ? "Make your call"
              : "Pick a side"}
      </p>
    </div>
  );
}

function PickButton({
  team,
  role,
  side,
  pick,
  active,
  locked,
  reduce,
  onPick,
}: {
  team: Team;
  role: string;
  side: Side;
  pick: Pick | null;
  active: boolean;
  locked: boolean;
  reduce: boolean;
  onPick: (side: Pick) => void;
}) {
  const selected = pick === side;
  const dimmed = active && !selected;
  return (
    <motion.button
      type="button"
      disabled={locked}
      onClick={() => onPick(side)}
      aria-pressed={selected}
      aria-label={`${team.name} (${role.toLowerCase()}) scores next`}
      whileTap={locked ? undefined : { scale: 0.97 }}
      animate={{ opacity: dimmed ? 0.5 : 1, scale: selected && !reduce ? 1.015 : 1 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
      className={`elev group flex flex-col items-center gap-2 rounded-card border px-4 py-5 outline-none transition-colors duration-200
        focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:cursor-default
        ${selected ? "border-up/70 bg-up/10" : "border-hairline/70 bg-surface hover:border-hairline"}`}
    >
      <TeamCrest code={team.code} size={48} />
      <span className="num font-display text-display font-extrabold leading-none tracking-tight text-hi">{team.code}</span>
      <span className={`text-label font-semibold uppercase tracking-[0.12em] ${selected ? "text-up" : "text-lo"}`}>{role}</span>
    </motion.button>
  );
}

/** The quiet third call (terminal only) — "nobody scores this window". A slim bar under the two teams, so the
 *  flags stay the heroes (subtract-then-elevate). Same press/selection vocabulary as the team picks. */
function NobodyButton({
  pick,
  active,
  locked,
  reduce,
  onPick,
}: {
  pick: Pick | null;
  active: boolean;
  locked: boolean;
  reduce: boolean;
  onPick: (side: Pick) => void;
}) {
  const selected = pick === "N";
  const dimmed = active && !selected;
  return (
    <motion.button
      type="button"
      disabled={locked}
      onClick={() => onPick("N")}
      aria-pressed={selected}
      aria-label="Nobody scores next — no goal this window"
      whileTap={locked ? undefined : { scale: 0.97 }}
      animate={{ opacity: dimmed ? 0.5 : 1 }}
      transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
      className={`elev group flex items-center justify-center gap-2 rounded-card border px-4 py-3 outline-none transition-colors duration-200
        focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:cursor-default
        ${selected ? "border-up/70 bg-up/10" : "border-hairline/70 bg-surface hover:border-hairline"}`}
    >
      <span className={`text-strong font-semibold ${selected ? "text-up" : "text-hi"}`}>Nobody</span>
      <span className="text-label font-semibold uppercase tracking-[0.12em] text-lo">no goal</span>
    </motion.button>
  );
}
