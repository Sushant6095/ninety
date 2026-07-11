import Link from "next/link";
import { MatchCard } from "../../components/ui/MatchCard";
import { routes } from "../../lib/routes";
import type { MarketRow } from "../../lib/types";

interface MatchListProps {
  markets: MarketRow[];
  emptyLabel?: string; // shown when the active filter yields no matches
}

/** The center hero — MatchCards grouped by competition (Sofascore structure, Ninety skin). */
export function MatchList({ markets, emptyLabel = "No matches in this view." }: MatchListProps) {
  const groups: Array<[string, MarketRow[]]> = [];
  for (const m of markets) {
    const g = groups.find(([label]) => label === m.competition);
    if (g) g[1].push(m);
    else groups.push([m.competition, [m]]);
  }

  if (markets.length === 0) {
    return (
      <div className="grid place-items-center px-4 py-16 text-center">
        <p className="text-body text-lo">{emptyLabel}</p>
        <Link href={routes.competition} className="mt-2 text-body text-up transition-opacity duration-200 hover:opacity-80">Browse the bracket →</Link>
      </div>
    );
  }

  return (
    <div>
      {groups.map(([label, rows]) => (
        <section key={label}>
          <header className="flex items-center gap-2 border-t border-hairline px-4 py-2 first:border-t-0">
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded bg-bg px-1 text-label font-semibold text-lo ring-1 ring-inset ring-hairline">
              {label === "Favourites" ? "★" : "R16"}
            </span>
            <h3 className="text-label font-semibold uppercase tracking-[0.1em] text-lo">{label}</h3>
            <span className="text-label text-lo/70">
              {rows.length} match{rows.length === 1 ? "" : "es"}
            </span>
          </header>
          <div className="divide-y divide-hairline/60">
            {rows.map((m) => (
              <MatchCard key={m.marketId} market={m} />
            ))}
          </div>
        </section>
      ))}
      <div className="flex items-center justify-between border-t border-hairline px-4 py-2">
        <span className="text-label text-lo">Quarter-finals begin Thu Jul 9 · Dallas &amp; Atlanta</span>
        <Link href={routes.competition} className="text-caption text-lo transition-colors duration-200 hover:text-hi">
          View bracket →
        </Link>
      </div>
    </div>
  );
}
