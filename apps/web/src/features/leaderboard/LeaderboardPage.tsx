import Link from "next/link";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { Avatar } from "../../components/ui/Avatar";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../../components/ui/HoverCard";
import { routes } from "../../lib/routes";
import { SESSION } from "../../lib/fixtures";
import { resolveProfile } from "../../lib/profile";
import { fmtCR, signedCR } from "../../lib/format";
import type { LeaderRow } from "../../lib/types";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");
// Medal ladder in NON-reserved tokens only: champion up-green → bright white → muted-but-ringed. Rank 3 used
// `text-chain` (violet) — but chain is the on-chain-ONLY token, never a bronze medal (same misuse fixed on the
// Moments Legendary chip). #3 is a filled+ringed grey so it still reads as a medal vs the transparent #4+ rows.
const medal = ["", "bg-up/15 text-up ring-up/40", "bg-hi/10 text-hi ring-hairline", "bg-hairline/60 text-lo ring-hairline"];

// Re-skinned shadcn HoverCard content — a trader mini-preview pulled from their profile.
function TraderPreview({ handle }: { handle: string }) {
  const p = resolveProfile(handle);
  const stats = [
    { label: "P&L", value: signedCR(p.pnl), tone: p.pnl >= 0 ? "up" : "down" },
    { label: "Win rate", value: `${Math.round(p.winRate * 100)}%`, tone: "hi" },
    { label: "Best swing", value: `+${fmtCR(p.bestSwing)}`, tone: "up" },
  ] as const;
  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar handle={handle} size={40} />
        <div className="min-w-0">
          <div className="truncate text-strong font-semibold text-hi">{p.handle}</div>
          <div className="num text-caption tabular-nums text-lo">Rank #{p.rank} · {p.trades} trades</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md bg-bg/40 px-2 py-1.5">
            <div className="text-label uppercase tracking-wide text-lo">{s.label}</div>
            <div className={`num mt-0.5 text-caption font-semibold tabular-nums ${s.tone === "up" ? "text-up" : s.tone === "down" ? "text-down" : "text-hi"}`}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-label font-medium text-up">View profile →</div>
    </>
  );
}

function Row({ row, you }: { row: LeaderRow; you: boolean }) {
  return (
    <li>
      <HoverCard openDelay={180} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Link
            href={routes.profile(row.handle)}
            className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 py-3 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 ${you ? "bg-up/[0.05]" : ""}`}
          >
            <span className={`num grid h-7 w-7 place-items-center rounded-full text-caption font-semibold ring-1 ring-inset ${row.rank <= 3 ? medal[row.rank] : "text-lo ring-transparent"}`}>
              {row.rank}
            </span>
            <span className="flex min-w-0 items-center gap-3">
              <Avatar handle={row.handle} size={32} />
              <span className="truncate text-strong font-medium text-hi">{row.handle}</span>
              {you && <span className="rounded-chip bg-surface px-2 py-0.5 text-label font-medium text-lo ring-1 ring-inset ring-hairline">you</span>}
            </span>
            <span className={`num text-strong font-semibold tabular-nums ${row.pnl >= 0 ? "text-up" : "text-down"}`}>{fmtPnl(row.pnl)}</span>
          </Link>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-72"><TraderPreview handle={row.handle} /></HoverCardContent>
      </HoverCard>
    </li>
  );
}

export function LeaderboardPage({ leaders }: { leaders: LeaderRow[] }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader user={SESSION} />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Leaderboard</h1>
          <p className="mt-1 text-body text-lo">Net play-money P&amp;L · World Cup 2026 · in credits (CR).</p>
        </div>

        {leaders.length === 0 ? (
          <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-16 text-center">
            <p className="text-body text-lo">No traders ranked yet — be the first to open a market.</p>
            <Link href={routes.matches} className="mt-2 text-body text-up transition-opacity duration-200 hover:opacity-80">Browse matches →</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-card border border-hairline bg-surface">
            <div className="grid grid-cols-[48px_1fr_auto] gap-3 border-b border-hairline px-4 py-2 text-label font-semibold uppercase tracking-tag text-lo">
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
