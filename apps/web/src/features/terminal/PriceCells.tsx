"use client";
import { LivePrice } from "../../components/ui/LivePrice";
import { Delta } from "../../components/ui/Delta";
import type { Outcome } from "../../lib/types";

const LABEL: Record<Outcome, string> = { H: "Home", D: "Draw", A: "Away" };

interface PriceCellsProps {
  mark: Record<Outcome, number>;
  todayDelta: Record<Outcome, number>;
  codes: { H: string; A: string };
  selected: Outcome;
  onSelect: (o: Outcome) => void;
  heldShares?: Partial<Record<Outcome, number>>; // shares held per outcome — badge updates as fills land
  disabled?: boolean; // PRE/SETTLED — cells shown but not armable
  frozen?: boolean; // HALTED — prices frozen, amber styling
}

/** The three tradeable outcome cells. Selecting one arms the trade panel; a held outcome shows a live share badge.
 *  `frozen` (halt) tints them amber and freezes selection; `disabled` (pre/settled) shows prices read-only. */
export function PriceCells({ mark, todayDelta, codes, selected, onSelect, heldShares, disabled = false, frozen = false }: PriceCellsProps) {
  const cells: Outcome[] = ["H", "D", "A"];
  const inert = disabled || frozen;
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-hairline px-4 py-3">
      {cells.map((o) => {
        const on = selected === o;
        const dl = todayDelta[o];
        const sub = o === "H" ? codes.H : o === "A" ? codes.A : null;
        const held = (heldShares?.[o] ?? 0) > 0;
        const ring = frozen ? "bg-halt/5 ring-halt/40" : on ? "bg-hairline/40 ring-up/50" : "bg-bg/50 ring-hairline/60 hover:ring-hairline";
        return (
          <button
            key={o}
            onClick={() => !inert && onSelect(o)}
            disabled={inert}
            aria-pressed={on}
            className={`relative flex flex-col gap-1 rounded-lg px-3 py-2 text-left outline-none ring-1 ring-inset transition-[color,background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-up ${ring} ${inert ? "cursor-default" : "active:scale-[0.97]"}`}
          >
            {/* Held-outcome marker: a small up dot in the corner, NOT a "60 SH" text chip. The ~66px lg cell
                cannot fit "AWAY" + a 34px "60 SH" chip in any horizontal arrangement (they overlapped even
                absolutely-positioned), and the exact share count already sits in YOUR POSITION directly below.
                The dot marks "you hold this outcome" and always clears the label. `aria-label` keeps it readable. */}
            {held && (
              <span aria-label={`${heldShares?.[o]} shares held`} className="absolute right-2 top-2 z-10 h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
            )}
            <span className={`flex min-w-0 items-baseline gap-1 text-label font-semibold uppercase tracking-micro text-lo ${held ? "pr-3" : ""}`}>
              {/* Base label shrink-0 so "HOME/DRAW/AWAY" is NEVER the thing that truncates; only the optional
                  ` · CODE` subtitle may clip. `pr-3` (held cells only) keeps the subtitle clear of the dot. */}
              <span className="shrink-0">{LABEL[o]}</span>
              {sub && <span className="hidden min-w-0 truncate text-lo sm:inline">· {sub}</span>}
            </span>
            <LivePrice value={mark[o] * 100} className="font-display text-display font-bold leading-none text-hi" />
            <Delta value={dl} suffix="today" className="text-label" />
          </button>
        );
      })}
    </div>
  );
}
