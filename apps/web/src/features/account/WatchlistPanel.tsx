"use client";
// Watchlist — the board's followed-match idiom (LeftRail MyMatchRow): identity from the seed's ★ favourites,
// minute/score/halt from the ONE live store so a row never disagrees with the board.
import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { routes } from "../../lib/routes";
import { MARKETS, koClock } from "../../lib/fixtures";
import { useMatchLive } from "../live/matchLiveStore";
import type { MarketRow } from "../../lib/types";

function WatchRow({ market }: { market: MarketRow }) {
  const live = useMatchLive(market.matchId);
  const minute = live?.minute ?? market.minute;
  const score = live?.score ?? market.score;
  const halted = live?.status === "HALTED";
  return (
    <li>
      <Link
        href={routes.match(market.matchId)}
        className="flex min-h-11 items-center gap-3 px-4 py-3 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 active:bg-hairline/40"
      >
        <span aria-hidden className="text-up">★</span>
        <span className="flex items-center gap-1.5">
          <TeamCrest code={market.homeCode} size={18} />
          <TeamCrest code={market.awayCode} size={18} />
        </span>
        <span className="min-w-0 truncate text-strong font-medium text-hi">{market.homeCode} – {market.awayCode}</span>
        {halted && <span className="rounded-chip bg-halt/15 px-1.5 py-0.5 text-label font-semibold uppercase tracking-wide text-halt">Halt</span>}
        <span className="num ml-auto text-label tabular-nums text-lo">
          {minute != null ? <span className={halted ? "text-halt" : "text-up"}>{minute}&#39;</span> : koClock(market.kickoffAt)}
        </span>
        {score && <span className="num text-caption font-medium tabular-nums text-hi">{score.home}–{score.away}</span>}
      </Link>
    </li>
  );
}

export function WatchlistBody() {
  const followed = MARKETS.filter((m) => m.favourite);
  if (followed.length === 0) {
    return (
      <div className="grid place-items-center px-4 py-10 text-center">
        <p className="text-body text-lo">Nothing followed yet — star a match on the board.</p>
        <Link
          href={routes.matches}
          className="mt-2 rounded-chip px-2 py-1 text-body text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-1 focus-visible:ring-up/40 active:scale-[0.97]"
        >
          Open the board →
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-hairline/60">
      {followed.map((m) => (
        <WatchRow key={m.matchId} market={m} />
      ))}
    </ul>
  );
}
