"use client";
import Link from "next/link";
import { routes } from "../../lib/routes";
import { useMatchLive } from "../../features/live/matchLiveStore";
import type { MarketRow, Outcome } from "../../lib/types";
import { Sparkline } from "./Sparkline";
import { PriceChip } from "./PriceChip";
import { Flag } from "./Flag";

const OUTCOMES: Outcome[] = ["H", "D", "A"];
const fmtVol = (n?: number): string => (n == null ? "" : n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : `${n}`);

function leadOutcome(mark: Record<string, number> | null): Outcome | null {
  if (!mark) return null;
  let best: Outcome | null = null;
  let bestV = -1;
  for (const o of OUTCOMES) if ((mark[o] ?? -1) > bestV) ((bestV = mark[o] ?? -1), (best = o));
  return best;
}

/** One match row — the most reused piece. Identity (teams, favourite, volume) from the seed row; status,
 *  minute, score, prices and spark from the ONE live store, so the board and the terminal never disagree. */
export function MatchCard({ market }: { market: MarketRow }) {
  const live = useMatchLive(market.matchId);
  const prices = live?.prices ?? market.mark;
  const spark = live?.spark ?? market.spark;
  const minute = live?.minute ?? market.minute;
  const score = live?.score ?? market.score;
  const isLive = live ? live.status === "LIVE" || live.status === "HALTED" : market.minute != null;
  const halted = live?.status === "HALTED";
  const lead = leadOutcome(prices);
  const rising = spark.length > 1 && spark[spark.length - 1] >= spark[0];

  return (
    <Link
      href={routes.match(market.matchId)}
      aria-label={`${market.home} vs ${market.away}${score ? `, ${score.home}–${score.away}` : ""} — open market`}
      className="group flex items-center gap-2 px-3 py-2 outline-none transition-colors duration-200 hover:bg-hairline/20 focus-visible:bg-hairline/20 active:bg-hairline/35 sm:gap-3 sm:px-4"
    >
      <span className={`w-4 shrink-0 text-center text-body ${market.favourite ? "text-up" : "text-lo/35"}`} aria-hidden>
        ★
      </span>

      <span className="w-9 shrink-0 text-center">
        {isLive ? (
          <>
            <span className={`num block text-caption font-semibold leading-none ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>
            <span className={`mt-0.5 block text-label font-medium tracking-tag ${halted ? "text-halt" : "text-lo"}`}>{halted ? "HALT" : "LIVE"}</span>
          </>
        ) : (
          <span className="text-label text-lo">—</span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <Flag code={market.homeCode} size={18} />
          <span className="truncate text-body font-medium text-hi">{market.home}</span>
        </span>
        <span className="mt-2 flex items-center gap-2">
          <Flag code={market.awayCode} size={18} />
          <span className="truncate text-body font-medium text-hi">{market.away}</span>
        </span>
      </span>

      <span className="w-5 shrink-0 text-right">
        <span className="num block text-body font-medium text-hi">{score?.home ?? ""}</span>
        <span className="num mt-2 block text-body font-medium text-hi">{score?.away ?? ""}</span>
      </span>

      {market.volume != null && (
        <span className="hidden w-14 shrink-0 flex-col items-end lg:flex" title="Credits traded">
          <span className="num text-caption font-medium tabular-nums text-hi/80">{fmtVol(market.volume)}</span>
          <span className="text-label uppercase tracking-wide text-lo">vol</span>
        </span>
      )}

      <span className="hidden shrink-0 opacity-90 sm:block">
        <Sparkline values={spark} up={rising} />
      </span>

      <span className="flex shrink-0 gap-1 sm:gap-1">
        {OUTCOMES.map((o) => (
          <PriceChip key={o} label={o} price={(prices?.[o] ?? 0) * 100} lead={lead === o} />
        ))}
      </span>
    </Link>
  );
}
