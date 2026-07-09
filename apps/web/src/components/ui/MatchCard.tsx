"use client";
import Link from "next/link";
import { routes } from "../../lib/routes";
import { useLiveMarket } from "../../features/home/LiveMarkets";
import type { MarketRow, Outcome } from "../../lib/types";
import { Sparkline } from "./Sparkline";
import { PriceChip } from "./PriceChip";

const OUTCOMES: Outcome[] = ["H", "D", "A"];

function leadOutcome(mark: Record<string, number> | null): Outcome | null {
  if (!mark) return null;
  let best: Outcome | null = null;
  let bestV = -1;
  for (const o of OUTCOMES) if ((mark[o] ?? -1) > bestV) ((bestV = mark[o] ?? -1), (best = o));
  return best;
}

/** One match row — the most reused piece. Whole row links to the match; prices/spark tick off the live provider. */
export function MatchCard({ market }: { market: MarketRow }) {
  const m = useLiveMarket(market.matchId) ?? market;
  const lead = leadOutcome(m.mark);
  const rising = m.spark.length > 1 && m.spark[m.spark.length - 1] >= m.spark[0];
  const live = m.minute != null;

  return (
    <Link
      href={routes.match(m.matchId)}
      aria-label={`${m.home} vs ${m.away}${m.score ? `, ${m.score.home}–${m.score.away}` : ""} — open market`}
      className="group flex items-center gap-2.5 px-3 py-2.5 outline-none transition-colors duration-200 hover:bg-hairline/20 focus-visible:bg-hairline/20 active:bg-hairline/35 sm:gap-3 sm:px-4"
    >
      <span className={`w-4 shrink-0 text-center text-[13px] transition-transform duration-200 group-hover:scale-110 ${m.favourite ? "text-up" : "text-lo/35"}`} aria-hidden>
        ★
      </span>

      <span className="w-9 shrink-0 text-center">
        {live ? (
          <>
            <span className="num block text-[12px] font-semibold leading-none text-up">{m.minute}&#39;</span>
            <span className="mt-0.5 block text-[9px] font-medium tracking-[0.1em] text-lo">LIVE</span>
          </>
        ) : (
          <span className="text-[11px] text-lo">—</span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[14px] leading-none">{m.homeFlag}</span>
          <span className="truncate text-[13px] font-medium text-hi">{m.home}</span>
        </span>
        <span className="mt-2 flex items-center gap-2">
          <span className="text-[14px] leading-none">{m.awayFlag}</span>
          <span className="truncate text-[13px] font-medium text-hi">{m.away}</span>
        </span>
      </span>

      <span className="w-5 shrink-0 text-right">
        <span className="num block text-[13px] font-medium text-hi">{m.score?.home ?? ""}</span>
        <span className="num mt-2 block text-[13px] font-medium text-hi">{m.score?.away ?? ""}</span>
      </span>

      <span className="hidden shrink-0 opacity-90 sm:block">
        <Sparkline values={m.spark} up={rising} />
      </span>

      <span className="flex shrink-0 gap-1 sm:gap-1.5">
        {OUTCOMES.map((o) => (
          <PriceChip key={o} label={o} price={(m.mark?.[o] ?? 0) * 100} lead={lead === o} />
        ))}
      </span>
    </Link>
  );
}
