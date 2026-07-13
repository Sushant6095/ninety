"use client";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Flag } from "../../components/ui/Flag";
import { LivePrice } from "../../components/ui/LivePrice";
import { useMatchLiveList } from "../live/matchLiveStore";
import { routes } from "../../lib/routes";
import { MARKETS } from "../../lib/fixtures";

const MOVER_COUNT = 4;
const MARKET_BY_ID = new Map(MARKETS.map((m) => [m.matchId, m])); // identity join — the store holds live values, not team codes

/** Biggest live price swings right now — a real exchange metric, recomputed every tick off the ONE live store. */
export function TopMovers() {
  const live = useMatchLiveList();
  const movers = live
    .filter((s) => s.status === "LIVE" && s.spark.length > 1 && MARKET_BY_ID.has(s.matchId))
    .map((s) => ({ row: MARKET_BY_ID.get(s.matchId)!, minute: s.minute, delta: s.spark[s.spark.length - 1] - s.spark[0], last: s.spark[s.spark.length - 1] }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, MOVER_COUNT);

  if (movers.length === 0) return null;

  return (
    <section className="border-t border-hairline px-3 py-3 sm:px-4">
      <h3 className="mb-2 flex items-center gap-2 text-label font-semibold uppercase tracking-[0.1em] text-lo">
        Biggest movers
        <span className="h-1 w-1 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
        <span className="font-normal normal-case tracking-normal text-lo/70">live · home price</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {movers.map(({ row, minute, delta, last }) => {
          const up = delta >= 0;
          return (
            <Link
              key={row.marketId}
              href={routes.match(row.matchId)}
              className="elev group flex flex-col gap-2 rounded-card border border-hairline/70 bg-surface p-3 transition-colors duration-200 hover:border-hairline"
            >
              <span className="flex items-center gap-1">
                <Flag code={row.homeCode} size={18} />
                <Flag code={row.awayCode} size={18} className="-ml-2" />
                <span className="num ml-1 text-label text-lo">{row.homeCode}–{row.awayCode}</span>
                <span className="num ml-auto text-label text-lo">{minute}&#39;</span>
              </span>
              <span className="flex items-end justify-between">
                <LivePrice value={last} className="font-display text-display font-bold leading-none text-hi" />
                <span className={`num inline-flex items-center gap-0.5 text-caption font-semibold ${up ? "text-up" : "text-down"}`}>
                  {up ? <ArrowUpRight size={13} strokeWidth={2.5} /> : <ArrowDownRight size={13} strokeWidth={2.5} />}
                  {up ? "+" : "−"}{Math.abs(delta).toFixed(1)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
