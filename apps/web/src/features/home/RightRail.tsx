"use client";
import Link from "next/link";
import { RailCard } from "../../components/ui/RailCard";
import { Avatar } from "../../components/ui/Avatar";
import { MagicCard } from "../../components/vendor/magicui/magic-card";
import { FeaturedPanel } from "./FeaturedPanel";
import { useMatchLiveList } from "../live/matchLiveStore";
import { routes } from "../../lib/routes";
import { LEADERS, MARKETS } from "../../lib/fixtures";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");
const TOP_TRADERS = 5; // the rail shows the leaders' head; the full board lives at /leaderboard
const STARTING_SOON = 3;
const HOUR = 3600_000;

const MARKET_BY_ID = new Map(MARKETS.map((m) => [m.matchId, m]));

/** "in 1h 40m" until kick-off, measured from the slate's own clock (the earliest kickoff on the board). */
function untilLabel(kickoffAt: string, from: number): string {
  const mins = Math.max(0, Math.round((Date.parse(kickoffAt) - from) / 60_000));
  return mins < 60 ? `in ${mins}m` : `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function RightRail() {
  // Starting soon is DERIVED from the matches the store says are still to kick off. It used to be a hardcoded
  // array, which drifted: it had Senegal kicking off against England in 1h 40m while Senegal was 41' into a live
  // match against France on the same board. A rail that invents its own slate will always end up contradicting it.
  const slate = useMatchLiveList();
  const pre = slate
    .filter((s) => s.status === "PRE" && MARKET_BY_ID.has(s.matchId))
    .map((s) => MARKET_BY_ID.get(s.matchId)!)
    .sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt));
  // Anchor "now" to the slate's own clock — a LIVE match's kickoff + its minute (+HT). The old anchor
  // ("first upcoming KO minus 1h40m") called a next-day 19:00 kickoff "in 1h 40m" on a board dated today.
  const live = slate.filter((s) => s.status !== "PRE" && s.minute != null && MARKET_BY_ID.has(s.matchId));
  const now = live.length
    ? Math.max(...live.map((s) => Date.parse(MARKET_BY_ID.get(s.matchId)!.kickoffAt) + (s.minute! + (s.minute! > 45 ? 15 : 0)) * 60_000))
    : pre.length
      ? Date.parse(pre[0].kickoffAt) - HOUR - 40 * 60_000
      : 0;
  const starting = pre.slice(0, STARTING_SOON);

  return (
    <aside aria-label="Featured match and top traders" className="flex w-full flex-col gap-3">
      <FeaturedPanel market={MARKETS[0]} />

      <RailCard
        label="Top traders today"
        action={<Link href={routes.leaders} className="text-label text-lo transition-colors duration-200 hover:text-hi">All →</Link>}
      >
        <ul>
          {LEADERS.slice(0, TOP_TRADERS).map((l) => (
            <li key={l.handle}>
              <Link href={routes.profile(l.handle)} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-200 hover:bg-hairline/30">
                <span className="num w-3 text-label tabular-nums text-lo">{l.rank}</span>
                <Avatar handle={l.handle} size={28} />
                <span className="truncate text-body font-medium text-hi">{l.handle}</span>
                <span className={`num ml-auto text-caption font-medium tabular-nums ${l.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtPnl(l.pnl)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard label="Starting soon">
        <ul>
          {starting.map((m) => (
            <li key={m.matchId}>
              <Link href={routes.match(m.matchId)} className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/30">
                <span className="min-w-0">
                  <span className="block text-body font-medium text-hi">{m.homeCode} – {m.awayCode}</span>
                  <span className="block text-label text-lo">{m.stage}</span>
                </span>
                <span className="num ml-auto text-label text-lo">{untilLabel(m.kickoffAt, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      {/* Moment of the day — an on-chain artifact, so the chain violet is legal here; the MagicCard
          spotlight (pointer-tracked border highlight) is tinted from the same token via color-mix. */}
      <MagicCard
        innerClassName="bg-chain/[0.04]"
        baseBorder="color-mix(in srgb, var(--chain) 25%, transparent)"
        spotlightColor="color-mix(in srgb, var(--chain) 45%, transparent)"
        glowColor="color-mix(in srgb, var(--chain) 6%, transparent)"
      >
        <Link
          href={routes.moments}
          className="block px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chain/60"
        >
          <h2 className="mb-1 flex items-center gap-1 text-label font-semibold uppercase tracking-label text-chain">
            <span aria-hidden>◆</span> Moment of the day
          </h2>
          <p className="font-display text-heading font-bold leading-tight text-hi">The 38th minute</p>
          <p className="num mt-1 text-label text-lo">
            CAN–MAR · David repricing <span className="text-up">41 → 63</span> · minted by @hexfan
          </p>
        </Link>
      </MagicCard>
    </aside>
  );
}
