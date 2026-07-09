import { MOVERS } from "../../lib/terminal";

const fmtDelta = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(1);

/** Today's movers — biggest Δ vs open across the R32 board (right rail, bottom). */
export function TodaysMovers() {
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Today&apos;s movers</h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Δ vs open</span>
      </div>
      <ul className="px-2 pb-2">
        {MOVERS.map((m) => (
          <li key={`${m.code}-${m.vs}`}>
            <a
              href="/match"
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-hairline/25"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-hi">
                  {m.code} <span className="text-lo">v</span> {m.vs}
                </span>
                <span className="block truncate text-[10px] text-lo">{m.note}</span>
              </span>
              <span className="num text-[13px] tabular-nums text-hi">{m.price.toFixed(1)}</span>
              <span className={`num w-[52px] text-right text-[12px] tabular-nums ${m.delta >= 0 ? "text-up" : "text-down"}`}>
                {fmtDelta(m.delta)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
