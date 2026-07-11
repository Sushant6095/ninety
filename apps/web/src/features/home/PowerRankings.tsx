import { Flag } from "../../components/ui/Flag";
import { teamName } from "../../lib/fixtures";
import { POWER_RANKINGS } from "../../lib/rankings";

/** Ninety Power Rankings — a market-implied strength table (our answer to Sofascore's Power Rankings).
 *  Rating priced from our own markets; movement is the shift vs the last update. */
export function PowerRankings() {
  return (
    <section className="elev mt-3 overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Ninety power rankings</h2>
        <span className="text-label uppercase tracking-wide text-lo">Market-implied · WC26</span>
      </div>
      <ul className="divide-y divide-hairline/60">
        {POWER_RANKINGS.map((row) => {
          const up = row.delta > 0;
          const flat = row.delta === 0;
          return (
            <li key={row.code} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-3 px-4 py-2 transition-colors duration-200 hover:bg-hairline/20">
              <span className="num text-caption font-semibold tabular-nums text-lo">{row.rank}</span>
              <span className="flex min-w-0 items-center gap-2">
                <Flag code={row.code} size={20} />
                <span className="truncate text-body font-medium text-hi">{teamName(row.code)}</span>
              </span>
              <span className="num text-strong font-semibold tabular-nums text-hi">{row.rating}</span>
              <span className={`num w-10 text-right text-caption font-medium tabular-nums ${flat ? "text-lo" : up ? "text-up" : "text-down"}`}>
                {flat ? "–" : `${up ? "▲" : "▼"}${Math.abs(row.delta)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
