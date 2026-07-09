import Link from "next/link";
import { Header } from "../home/Header";
import { Footer } from "../home/Footer";
import { Avatar } from "../../components/ui/Avatar";
import { routes } from "../../lib/routes";
import { SESSION } from "../../lib/fixtures";
import type { LeaderRow } from "../../lib/types";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");
const medal = ["", "bg-up/15 text-up ring-up/30", "bg-hi/10 text-hi ring-hairline", "bg-chain/15 text-chain ring-chain/30"];

function Row({ row, you }: { row: LeaderRow; you: boolean }) {
  return (
    <li>
      <Link
        href={routes.profile(row.handle)}
        className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-hairline/25 ${you ? "bg-up/[0.05]" : ""}`}
      >
        <span className={`num grid h-7 w-7 place-items-center rounded-full text-[12px] font-semibold ring-1 ring-inset ${row.rank <= 3 ? medal[row.rank] : "text-lo ring-transparent"}`}>
          {row.rank}
        </span>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar handle={row.handle} size={32} />
          <span className="truncate text-[14px] font-medium text-hi">{row.handle}</span>
          {you && <span className="rounded-chip bg-surface px-2 py-0.5 text-[10px] font-medium text-lo ring-1 ring-inset ring-hairline">you</span>}
        </span>
        <span className={`num text-[14px] font-semibold tabular-nums ${row.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtPnl(row.pnl)}</span>
      </Link>
    </li>
  );
}

export function LeaderboardPage({ leaders }: { leaders: LeaderRow[] }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <Header user={SESSION} />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-hi">Leaderboard</h1>
          <p className="mt-1 text-[13px] text-lo">Net play-money P&amp;L · World Cup 2026 · in credits (CR).</p>
        </div>

        {leaders.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-16 text-center">
            <p className="text-[13px] text-lo">No traders ranked yet — be the first to open a market.</p>
            <Link href={routes.home} className="mt-2 text-[13px] text-up transition-opacity duration-200 hover:opacity-80">Browse matches →</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            <div className="grid grid-cols-[48px_1fr_auto] gap-3 border-b border-hairline px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-lo">
              <span>Rank</span>
              <span>Trader</span>
              <span className="text-right">P&amp;L</span>
            </div>
            <ul className="divide-y divide-hairline/60">
              {leaders.map((l) => (
                <Row key={l.handle} row={l} you={l.handle.toLowerCase() === SESSION.handle.toLowerCase()} />
              ))}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
