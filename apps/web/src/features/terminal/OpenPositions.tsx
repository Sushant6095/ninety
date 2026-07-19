"use client";
import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { routes } from "../../lib/routes";
import { useSession } from "../session/SessionProvider";
import { useMatchLiveList } from "../live/matchLiveStore";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");

/** OPEN POSITIONS · right-rail card. Reads the REAL per-session positions — a fresh account has none and shows
 *  an honest empty state, so it can never contradict the header. P&L is computed live off the store's mark. */
export function OpenPositions() {
  const session = useSession();
  const positions = session.positions;
  const liveById = new Map(useMatchLiveList().map((s) => [s.matchId, s]));

  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">OPEN POSITIONS</h2>
        <span className="num text-label tabular-nums text-lo">{positions.length}</span>
      </div>
      {positions.length === 0 ? (
        <p className="px-4 pb-4 pt-1 text-label leading-relaxed text-lo">
          No open positions yet.{" "}
          <Link
            href={routes.board}
            className="text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:underline"
          >
            Find a live match to trade →
          </Link>
        </p>
      ) : (
        <ul className="px-2 pb-2">
          {positions.map((p) => {
            const live = liveById.get(p.matchId);
            const mark = live ? live.prices[p.outcome] * 100 : p.markNow;
            const pnl = Math.round(p.shares * (mark - p.avgEntry));
            const pre = p.status === "PRE";
            const crest = p.pick === "DRAW" ? p.homeCode : p.pick;
            return (
              <li key={p.marketId}>
                <Link
                  href={routes.match(p.matchId)}
                  className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hairline"
                >
                  <TeamCrest code={crest} size={20} />
                  <span className="min-w-0">
                    <span className="block truncate text-body font-medium text-hi">
                      {p.homeCode} v {p.awayCode}
                    </span>
                    <span className="num block text-label tabular-nums text-lo">{p.shares} sh</span>
                  </span>
                  <span className="ml-auto flex flex-col items-end">
                    {pre ? (
                      <span className="text-label uppercase tracking-micro text-lo">PRE</span>
                    ) : (
                      <span className={`num text-body font-semibold tabular-nums ${pnl >= 0 ? "text-up" : "text-down"}`}>
                        {fmtPnl(pnl)}
                      </span>
                    )}
                    <span className="num text-label tabular-nums text-lo">@{p.avgEntry.toFixed(1)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
