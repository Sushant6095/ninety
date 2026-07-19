import Link from "next/link";
import { Avatar } from "../../components/ui/Avatar";
import { AvatarCircles } from "../../components/vendor/magicui/avatar-circles";
import { BentoCard } from "../../components/vendor/magicui/bento-grid";
import { LEADERS } from "../../lib/fixtures";
import { routes } from "../../lib/routes";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");
// Rank-3 medal must NOT use `chain` (the on-chain-only token) — matches the leaderboard fix. Ladder: champion
// up-green → bright white → muted-but-ringed grey.
const medal = ["bg-up/15 text-up ring-up/25", "bg-hi/10 text-hi ring-hairline", "bg-hairline/60 text-lo ring-hairline"];

/** Traders of the week — Sofascore's "team of the week" analogue: top performers by P&L (modeled, BLOCKERS B2).
 *  Shell is the re-skinned magicui BentoCard; the header carries the AvatarCircles facepile (top five +
 *  the "+N" mono overflow), all one link into the leaderboard. */
export function TradersWeek() {
  const top = LEADERS.slice(0, 5);
  const rest = LEADERS.length - top.length;
  return (
    <BentoCard className="px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-label font-semibold uppercase tracking-tag text-lo">Traders of the week</h3>
        <Link
          href={routes.leaders}
          className="hit group flex items-center gap-2 rounded-chip text-label text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:shadow-[0_0_0_2px_var(--up)] active:scale-[0.97]"
        >
          <AvatarCircles handles={top.map((l) => l.handle)} numPeople={rest} size={24} />
          <span>Leaderboard →</span>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {top.map((l, i) => (
          <Link
            key={l.handle}
            href={routes.profile(l.handle)}
            className="elev group flex flex-col items-center gap-2 rounded-card border border-hairline/70 bg-surface p-3 text-center outline-none transition-colors duration-200 hover:border-hairline focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/60"
          >
            <span className="relative">
              <Avatar handle={l.handle} size={48} />
              <span className={`num absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-label font-semibold ring-1 ring-inset ring-bg ${medal[i] ?? "bg-surface text-lo ring-hairline"}`}>
                {l.rank}
              </span>
            </span>
            <span className="w-full truncate text-caption font-medium text-hi">{l.handle}</span>
            <span className="num text-body font-semibold tabular-nums text-up">{fmtPnl(l.pnl)}</span>
          </Link>
        ))}
      </div>
    </BentoCard>
  );
}
