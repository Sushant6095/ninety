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
        const ring = frozen ? "bg-halt/5 ring-halt/40" : on ? "bg-hairline/40 ring-up/50" : "bg-bg/50 ring-hairline/60 hover:ring-hairline";
        return (
          <button
            key={o}
            onClick={() => !inert && onSelect(o)}
            disabled={inert}
            aria-pressed={on}
            className={`flex flex-col gap-1 rounded-lg px-3 py-2 text-left outline-none ring-1 ring-inset transition-[color,background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-up ${ring} ${inert ? "cursor-default" : "active:scale-[0.97]"}`}
          >
            <span className="flex items-center justify-between gap-1">
              <span className="min-w-0 truncate text-label font-semibold uppercase tracking-micro text-lo">
                {LABEL[o]}{sub && <span className="hidden text-lo sm:inline"> · {sub}</span>}
              </span>
              {(heldShares?.[o] ?? 0) > 0 && (
                <span className="num shrink-0 rounded bg-up/15 px-1 text-label font-semibold text-up ring-1 ring-inset ring-up/25">{heldShares?.[o]} SH</span>
              )}
            </span>
            <LivePrice value={mark[o] * 100} className="font-display text-display font-bold leading-none text-hi" />
            <Delta value={dl} suffix="today" className="text-label" />
          </button>
        );
      })}
    </div>
  );
}
