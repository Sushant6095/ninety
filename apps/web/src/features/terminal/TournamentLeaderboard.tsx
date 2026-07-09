import Link from "next/link";
import { Avatar } from "../../components/ui/Avatar";
import { LEADERS } from "../../lib/fixtures";
import { SESSION_RANK } from "../../lib/terminal";
import { routes } from "../../lib/routes";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");

/** Tournament leaderboard rail — top 5 traders, then a pinned "you" row from the current session. */
export function TournamentLeaderboard() {
  const { rank, handle, pnl, delta } = SESSION_RANK;
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Leaderboard — Tournament</h2>
        <Link href={routes.leaders} className="text-[11px] text-lo transition-colors duration-200 hover:text-hi">All →</Link>
      </div>

      <ul className="px-2">
        {LEADERS.slice(0, 5).map((l) => (
          <li key={l.handle}>
            <Link href={routes.profile(l.handle)} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-hairline/30">
              <span className="num w-3 text-[11px] tabular-nums text-lo">{l.rank}</span>
              <Avatar handle={l.handle} size={26} />
              <span className="truncate text-[13px] font-medium text-hi">{l.handle}</span>
              <span className="num ml-auto text-[12px] font-medium tabular-nums text-up">{fmtPnl(l.pnl)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="px-2 pb-2 pt-1">
        <Link
          href={routes.profile(handle)}
          className="flex items-center gap-2.5 rounded-lg border border-up/20 bg-up/[0.05] px-2 py-1.5 transition-colors duration-200 hover:bg-up/10"
        >
          <span className="num w-3 text-[11px] tabular-nums text-lo">{rank}</span>
          <Avatar handle={handle} size={26} />
          <span className="truncate text-[13px] font-medium text-hi">{handle}</span>
          <span className="num ml-auto flex items-center gap-1.5 text-[12px] font-medium tabular-nums text-up">
            {fmtPnl(pnl)}
            <span className="text-[10px] text-lo">▲{delta}</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
