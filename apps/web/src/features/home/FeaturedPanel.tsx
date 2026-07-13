"use client";
import Link from "next/link";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { Flag } from "../../components/ui/Flag";
import { LivePrice } from "../../components/ui/LivePrice";
import { useMatchLive } from "../live/matchLiveStore";
import { routes } from "../../lib/routes";
import type { MarketRow, Outcome } from "../../lib/types";

function Cell({ label, price, lead }: { label: string; price: number; lead: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 ring-1 ring-inset transition-colors duration-200 ${lead ? "bg-hairline/45 ring-hairline" : "bg-bg/60 ring-hairline/50"}`}>
      <span className="text-label font-semibold uppercase tracking-[0.08em] text-lo">{label}</span>
      <LivePrice value={price} className={`text-heading font-bold ${lead ? "text-hi" : "text-hi/85"}`} />
    </div>
  );
}

/** Featured live match — the right-rail hero. Read-only market + live River + big prices; the CTA links to the
 *  match (the trade action itself is deferred, ADR-042/BLOCKED B1). Ticks off the shared live provider. */
export function FeaturedPanel({ market }: { market: MarketRow }) {
  const live = useMatchLive(market.matchId);
  const mk = (live?.prices ?? market.mark ?? { H: 0, D: 0, A: 0 }) as Record<Outcome, number>;
  const spark = live?.spark ?? market.spark;
  const minute = live?.minute ?? market.minute;
  const score = live?.score ?? market.score;
  const halted = live?.status === "HALTED";
  const lead: Outcome = mk.H >= mk.D && mk.H >= mk.A ? "H" : mk.A >= mk.D ? "A" : "D";
  const rising = spark.length > 1 && spark[spark.length - 1] >= spark[0];
  const latest = spark[spark.length - 1];

  return (
    <section className="elev-hi overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3">
        <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Featured — {halted ? "Halted" : "Live"}</h2>
        <span className={`num inline-flex items-center gap-1 text-label ${halted ? "text-halt" : "text-up"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${halted ? "bg-halt" : "bg-up shadow-[0_0_6px_var(--up)]"}`} />
          {minute}&#39;
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <span className="flex flex-col items-center gap-1">
          <Flag code={market.homeCode} size={40} />
          <span className="text-label font-medium tracking-wide text-lo">{market.homeCode}</span>
        </span>
        <span className="num font-display text-display-xl font-extrabold leading-none tabular-nums text-hi">
          {score?.home}<span className="px-1 text-lo">–</span>{score?.away}
        </span>
        <span className="flex flex-col items-center gap-1">
          <Flag code={market.awayCode} size={40} />
          <span className="text-label font-medium tracking-wide text-lo">{market.awayCode}</span>
        </span>
      </div>

      <div className="px-1">
        <MomentumRiver data={market.spark} up={rising} height={108} goalIndex={13} liveValue={latest} />
      </div>

      <div className="grid grid-cols-3 gap-1 px-3 pt-1">
        <Cell label="Home" price={mk.H * 100} lead={lead === "H"} />
        <Cell label="Draw" price={mk.D * 100} lead={lead === "D"} />
        <Cell label="Away" price={mk.A * 100} lead={lead === "A"} />
      </div>

      <div className="p-3 pt-2">
        <Link
          href={routes.match(market.matchId)}
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-up px-4 py-2 text-strong font-semibold text-bg transition-[filter,transform] duration-200 ease-out hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Trade this match
        </Link>
      </div>
    </section>
  );
}
