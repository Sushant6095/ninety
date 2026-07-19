"use client";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { POSITIONS, type PositionRow } from "../../lib/terminal";
import { useMatchLiveList } from "../live/matchLiveStore";

const fmtPnl = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US");

/** P&L off the store's live mark for an in-play row (a seeded P&L can lie, per the fixture note); rows the store
 *  doesn't carry fall back to their seed. So the terminal EGY position and /portfolio read the same live price. */
function pnlOf(p: PositionRow, mark: number | undefined): number | null {
  return mark == null ? p.pnl : Math.round(p.shares * (mark - p.avgEntry));
}

function Pnl({ pnl, pre }: { pnl: number | null; pre?: boolean }) {
  if (pre) return <span className="text-label uppercase tracking-micro text-lo">PRE</span>;
  const n = pnl ?? 0;
  return <span className={`num text-body font-semibold tabular-nums ${n >= 0 ? "text-up" : "text-down"}`}>{fmtPnl(n)}</span>;
}

/** OPEN POSITIONS · right-rail card. Live P&L per held outcome; PRE for matches not yet kicked off. */
export function OpenPositions() {
  const liveById = new Map(useMatchLiveList().map((s) => [s.matchId, s]));
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">OPEN POSITIONS</h2>
        <span className="num text-label tabular-nums text-lo">{POSITIONS.length}</span>
      </div>
      <ul className="px-2 pb-2">
        {POSITIONS.map((p) => {
          const live = liveById.get(p.marketId);
          const mark = p.live && live ? live.prices[p.outcome] * 100 : undefined;
          return (
            <li key={p.marketId}>
              <a
                href={`/match/${p.marketId}`}
                className="flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hairline"
              >
                <TeamCrest code={p.code} size={20} />
                <span className="min-w-0">
                  <span className="block truncate text-body font-medium text-hi">
                    {p.code} v {p.vs}
                  </span>
                  <span className="num block text-label tabular-nums text-lo">{p.shares} sh</span>
                </span>
                <span className="ml-auto flex flex-col items-end">
                  <Pnl pnl={pnlOf(p, mark)} pre={p.pre} />
                  <span className="num text-label tabular-nums text-lo">@{p.avgEntry.toFixed(1)}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
