import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { fmtPrice, signedPct } from "../../lib/format";
import { rarityOf, swingOf } from "../../lib/moments";
import { marketMomentsFor, type PlayerProfile } from "./data";

/** Market impact — the panel no stats site can show, because they don't run a market. When {nation} played, how did
 *  Ninety's price (a probability) move? Sourced ONLY from our own modeled Moments and shown at TEAM level — we never
 *  claim a specific goal was this player's, which we can't source (that would be fabrication). Copy stays play-money:
 *  price / trade / credits only. */
export function MarketImpact({ p }: { p: PlayerProfile }) {
  const moments = marketMomentsFor(p.nat);
  return (
    <section className="elev rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-strong font-semibold text-hi">Market impact</h2>
        <span className="text-label uppercase tracking-micro text-lo">price is probability</span>
      </div>
      <p className="mt-1 text-caption text-lo">
        The biggest price moves in {p.natName ?? p.nat}&apos;s matches on Ninety&apos;s market — the row names whose win price moved. Modeled at team level, not attributed to a single goal.
      </p>

      {moments.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-hairline p-4 text-caption text-lo">
          No market-moving moments modeled for {p.natName ?? p.nat} yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {moments.map((m) => {
            const swing = swingOf(m);
            const up = swing >= 0;
            return (
              <li key={m.id}>
                <Link
                  href={`/moments/${m.id}`}
                  className="group block rounded-card border border-hairline bg-bg/40 p-3 transition-colors duration-200 hover:border-hairline hover:bg-hairline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="num text-label font-semibold tabular-nums text-lo">{m.minute}&#39;</span>
                      <TeamCrest code={m.homeCode} size={16} />
                      <TeamCrest code={m.awayCode} size={16} />
                      <span className="truncate text-caption font-medium text-hi">{m.title}</span>
                    </span>
                    <span className={`num shrink-0 text-caption font-semibold tabular-nums ${up ? "text-up" : "text-down"}`}>{signedPct(swing)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="w-24 shrink-0">
                      <EquityCurve values={m.segment} up={up} height={28} />
                    </span>
                    <span className="num text-caption tabular-nums text-lo">
                      {m.pick} {fmtPrice(m.fromPrice)} → <span className="text-hi">{fmtPrice(m.toPrice)}</span>
                    </span>
                    <span className="ml-auto text-label uppercase tracking-micro text-lo">{rarityOf(m)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
