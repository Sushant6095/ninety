import { MARKET_STATUS } from "../../lib/terminal";

const { status, tick, feedMs, b, tradersIn } = MARKET_STATUS;

const TILES: { value: string; label: string }[] = [
  { value: `${tick.toFixed(1)}s`, label: "TICK" },
  { value: `${feedMs}ms`, label: "FEED" },
  { value: b.toLocaleString("en-US"), label: "LMSR B" },
  { value: tradersIn.toLocaleString("en-US"), label: "TRADERS IN" },
];

export function MarketStatus() {
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Market status</h2>
        <span className="rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-up">
          {status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {TILES.map((t) => (
          <div key={t.label} className="rounded-lg bg-bg p-2.5 ring-1 ring-inset ring-hairline/60">
            <div className="num text-[17px] font-bold tabular-nums text-hi">{t.value}</div>
            <div className="mt-0.5 text-[9px] uppercase tracking-wide text-lo">{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
