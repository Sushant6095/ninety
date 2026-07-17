import { BentoCard } from "../../components/vendor/magicui/bento-grid";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { teamName } from "../../lib/fixtures";
import { POWER_RANKINGS } from "../../lib/rankings";

/** Ninety Power Rankings — a market-implied strength table (our answer to Sofascore's Power Rankings).
 *  Rating priced from our own markets; movement is the shift vs the last update.
 *  Shell is the re-skinned magicui BentoCard — the board bento's tall narrow cell. */
export function PowerRankings() {
  return (
    <BentoCard>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Ninety power rankings</h2>
        <span className="text-label uppercase tracking-wide text-lo">Market-implied · WC26</span>
      </div>
      <ul className="divide-y divide-hairline/60">
        {POWER_RANKINGS.map((row) => {
          const up = row.delta > 0;
          const flat = row.delta === 0;
          // Tight columns so the TEAM NAME survives the narrow (~188px at lg) tall cell: at the old gap-3 + w-10
          // delta the name's 1fr collapsed to 0 and rows read crest-only (a scannability regression for the
          // casual fan the board courts). 18px rank + px-3 + gap-x-1.5 + w-6 delta buys the name back its width.
          return (
            <li key={row.code} className="grid grid-cols-[18px_minmax(0,1fr)_auto_auto] items-center gap-x-1.5 px-3 py-2 transition-colors duration-200 hover:bg-hairline/20">
              <span className="num text-caption font-semibold tabular-nums text-lo">{row.rank}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <TeamCrest code={row.code} size={18} />
                <span className="truncate text-body font-medium text-hi">{teamName(row.code)}</span>
              </span>
              <span className="num text-strong font-semibold tabular-nums text-hi">{row.rating}</span>
              <span className={`num w-6 text-right text-caption font-medium tabular-nums ${flat ? "text-lo" : up ? "text-up" : "text-down"}`}>
                {flat ? "–" : `${up ? "▲" : "▼"}${Math.abs(row.delta)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </BentoCard>
  );
}
