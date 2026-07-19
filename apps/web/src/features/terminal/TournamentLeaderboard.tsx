"use client";
import Link from "next/link";
import { Avatar } from "../../components/ui/Avatar";
import { LEADERS } from "../../lib/fixtures";
import { useSession } from "../session/SessionProvider";
import { routes } from "../../lib/routes";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");

/** Tournament leaderboard rail (TERTIARY · quieter, no elevation) · top 5 traders, then a pinned "you" row read
 *  from the session provider. A fresh account has rank null → an honest "Unranked" row with no fabricated P&L,
 *  never a borrowed rank 142 / @you. */
export function TournamentLeaderboard() {
  const session = useSession();
  const ranked = session.rank != null;
  return (
    <section className="rounded-card border border-hairline/60 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Leaderboard · Tournament</h2>
        <Link href={routes.leaders} className="text-label text-lo transition-colors duration-200 hover:text-hi">All →</Link>
      </div>

      <ul className="px-2">
        {LEADERS.slice(0, 5).map((l) => (
          <li key={l.handle}>
            <Link href={routes.profile(l.handle)} className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-200 hover:bg-hairline/30">
              <span className="num w-3 text-label tabular-nums text-lo">{l.rank}</span>
              <Avatar handle={l.handle} size={26} />
              <span className="truncate text-body font-medium text-hi">{l.handle}</span>
              <span className="num ml-auto text-caption font-medium tabular-nums text-up">{fmtPnl(l.pnl)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-2 pb-2 pt-1">
        <Link
          href={routes.profile(session.handle)}
          aria-label={ranked ? `You · rank ${session.rank}` : "You · unranked"}
          className="flex items-center gap-2 rounded-lg border border-up/20 bg-up/[0.05] px-2 py-1 transition-colors duration-200 hover:bg-up/10"
        >
          <span className="num w-3 text-label tabular-nums text-lo">{ranked ? session.rank : "—"}</span>
          <Avatar handle={session.handle} size={26} />
          <span className="truncate text-body font-medium text-hi">{session.handle}</span>
          <span className="ml-auto text-label font-semibold uppercase tracking-micro text-lo">{ranked ? "You" : "Unranked"}</span>
        </Link>
      </div>
    </section>
  );
}
