"use client";
import { LivePrice } from "../home/LiveMarkets";

interface YourPositionProps {
  code: string; // held outcome's code, e.g. "EGY"
  shares: number;
  avgEntry: number; // 0..100
  markPct: number; // live price of the held outcome, 0..100
  opened: string; // "opened pre-match @ 22'"
}

/** The user's live position in the selected market — value + unrealized P&L recompute off the ticking mark. */
export function YourPosition({ code, shares, avgEntry, markPct, opened }: YourPositionProps) {
  const value = (shares * markPct) / 100 * 100; // shares × price(cr); price in 0..100 → credits per share
  const cost = shares * avgEntry / 100 * 100;
  const pnl = value - cost;
  const pct = cost > 0 ? (pnl / cost) * 100 : 0;
  const up = pnl >= 0;

  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Your position</h3>
        <span className="num rounded bg-up/12 px-1.5 py-0.5 text-[9px] font-semibold text-up ring-1 ring-inset ring-up/25">{code} · {shares} SH</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <LivePrice value={value} decimals={0} className="font-display text-[26px] font-bold leading-none text-hi" />
          <span className="ml-1 text-[11px] text-lo">cr value</span>
        </div>
        <div className={`num text-right text-[13px] font-semibold ${up ? "text-up" : "text-down"}`}>
          {up ? "+" : "−"}{Math.abs(Math.round(pnl)).toLocaleString("en-US")}
          <span className="ml-1 text-[11px]">({up ? "+" : "−"}{Math.abs(pct).toFixed(1)}%)</span>
        </div>
      </div>
      <div className="num mt-1.5 text-[10px] text-lo">Avg entry {avgEntry.toFixed(1)} · {opened}</div>
    </div>
  );
}
