import Link from "next/link";
import { Avatar } from "../../components/ui/Avatar";
import { LEADERS } from "../../lib/fixtures";
import { routes } from "../../lib/routes";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");
const medal = ["bg-up/15 text-up ring-up/25", "bg-hi/10 text-hi ring-hairline", "bg-chain/15 text-chain ring-chain/25"];

/** Traders of the week — Sofascore's "team of the week" analogue: top performers with real photos + P&L. */
export function TradersWeek() {
  const top = LEADERS.slice(0, 5);
  return (
    <section className="border-t border-hairline px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-label font-semibold uppercase tracking-[0.1em] text-lo">Traders of the week</h3>
        <Link href={routes.leaders} className="text-label text-lo transition-colors duration-200 hover:text-hi">Leaderboard →</Link>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {top.map((l, i) => (
          <Link
            key={l.handle}
            href={routes.profile(l.handle)}
            className="elev group flex flex-col items-center gap-2 rounded-card border border-hairline/70 bg-surface p-3 text-center transition-colors duration-200 hover:border-hairline"
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
    </section>
  );
}
