"use client";
import { useState } from "react";
import { quote } from "../../lib/lmsr";
import type { Outcome } from "../../lib/types";

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };
const fmtCr = (n: number): string => Math.round(n).toLocaleString("en-US");
const MIN = 10, MAX = 500, STEP = 10;

interface TradePanelProps {
  amm: { q: number[]; b: number; spreadMult: number };
  selected: Outcome;
  code: string; // outcome's team code, e.g. "EGY"
}

/** Buy/Sell + size + live LMSR quote (COST / AVG PX / MAX PAYOUT). Mirrors GET /markets/:id/quote; the actual
 *  fill posts to the order gateway once it ships (ADR-026 H2/H3) — until then this previews and confirms intent. */
export function TradePanel({ amm, selected, code }: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [size, setSize] = useState(60);
  const [placed, setPlaced] = useState(false);

  const q = quote(amm.q, amm.b, IDX[selected], size, side, amm.spreadMult);

  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-bg p-0.5 ring-1 ring-inset ring-hairline">
          {(["buy", "sell"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setSide(s); setPlaced(false); }}
              aria-pressed={side === s}
              className={`num rounded-md px-4 py-1.5 text-[13px] font-semibold capitalize transition-colors duration-200 ${side === s ? (s === "buy" ? "bg-up text-bg" : "bg-down text-bg") : "text-lo hover:text-hi"}`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          <input
            type="range" min={MIN} max={MAX} step={STEP} value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPlaced(false); }}
            aria-label="Order size in shares"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-hairline accent-up"
          />
          <div className="shrink-0 text-right">
            <div className="num text-[15px] font-bold text-hi">{size}</div>
            <div className="text-[8px] uppercase tracking-wide text-lo">size</div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end gap-4">
        <dl className="grid flex-1 grid-cols-3 gap-2">
          <div><dt className="text-[8px] uppercase tracking-wide text-lo">Cost</dt><dd className="num text-[14px] font-semibold text-hi">{fmtCr(q.cost)} <span className="text-[10px] text-lo">cr</span></dd></div>
          <div><dt className="text-[8px] uppercase tracking-wide text-lo">Avg px</dt><dd className="num text-[14px] font-semibold text-hi">{q.avgPx.toFixed(1)}</dd></div>
          <div><dt className="text-[8px] uppercase tracking-wide text-lo">Max payout</dt><dd className="num text-[14px] font-semibold text-hi">{fmtCr(q.maxPayout)} <span className="text-[10px] text-lo">cr</span></dd></div>
        </dl>

        <button
          onClick={() => setPlaced(true)}
          className={`min-h-[44px] shrink-0 rounded-lg px-5 text-[14px] font-semibold text-bg transition-[filter,transform] duration-200 ease-out hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${side === "buy" ? "bg-up focus-visible:ring-up" : "bg-down focus-visible:ring-down"}`}
        >
          {side === "buy" ? "Buy" : "Sell"} {code} @ {q.avgPx.toFixed(1)}
        </button>
      </div>

      {placed && (
        <p className="num mt-2 text-[10px] text-lo" role="status">
          Quote locked · {size} {code} @ {q.avgPx.toFixed(1)} — fills settle once the order gateway ships (ADR-026). No credits moved.
        </p>
      )}
    </div>
  );
}
