"use client";
import { LivePrice } from "../home/LiveMarkets";
import type { Outcome } from "../../lib/types";

const LABEL: Record<Outcome, string> = { H: "Home", D: "Draw", A: "Away" };

interface PriceCellsProps {
  mark: Record<Outcome, number>;
  todayDelta: Record<Outcome, number>;
  codes: { H: string; A: string };
  selected: Outcome;
  onSelect: (o: Outcome) => void;
  heldOutcome?: Outcome;
  heldShares?: number;
}

/** The three tradeable outcome cells. Selecting one arms the trade panel; the held outcome shows a share badge. */
export function PriceCells({ mark, todayDelta, codes, selected, onSelect, heldOutcome, heldShares }: PriceCellsProps) {
  const cells: Outcome[] = ["H", "D", "A"];
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-hairline px-4 py-3">
      {cells.map((o) => {
        const on = selected === o;
        const dl = todayDelta[o];
        const sub = o === "H" ? codes.H : o === "A" ? codes.A : null;
        return (
          <button
            key={o}
            onClick={() => onSelect(o)}
            aria-pressed={on}
            className={`relative flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left ring-1 ring-inset transition-colors duration-200 ${on ? "bg-hairline/40 ring-up/50" : "bg-bg/50 ring-hairline/60 hover:ring-hairline"}`}
          >
            {heldOutcome === o && heldShares != null && (
              <span className="num absolute right-2 top-2 rounded bg-up/15 px-1 text-[9px] font-semibold text-up ring-1 ring-inset ring-up/25">{heldShares} SH</span>
            )}
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-lo">
              {LABEL[o]}{sub && <span className="text-lo/70"> · {sub}</span>}
            </span>
            <LivePrice value={mark[o] * 100} className="font-display text-[26px] font-bold leading-none text-hi" />
            <span className={`num text-[10px] ${dl >= 0 ? "text-up" : "text-down"}`}>
              {dl >= 0 ? "▲" : "▼"}{Math.abs(dl).toFixed(1)} today
            </span>
          </button>
        );
      })}
    </div>
  );
}
