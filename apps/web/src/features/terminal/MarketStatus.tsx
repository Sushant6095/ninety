"use client";
import { useMatchLive, TERMINAL_MATCH_ID, type MatchStatus } from "../live/matchLiveStore";
import { MARKET_STATUS } from "../../lib/terminal";

const { tick, feedMs, b, tradersIn } = MARKET_STATUS;

const TILES: { value: string; label: string }[] = [
  { value: `${tick.toFixed(1)}s`, label: "TICK" },
  { value: `${feedMs}ms`, label: "FEED" },
  { value: b.toLocaleString("en-US"), label: "LMSR B" },
  { value: tradersIn.toLocaleString("en-US"), label: "TRADERS IN" },
];

// Status pill styling — amber only while halted (design law: amber = halts).
const PILL: Record<MatchStatus, string> = {
  PRE: "text-lo ring-hairline",
  LIVE: "text-up ring-up/30",
  HALTED: "text-halt ring-halt/50",
  SETTLED: "text-lo ring-hairline",
};

/** Right-rail status card. The status word reads from the ONE store (so it can never disagree with the
 *  center header / switcher); the tick/feed/B/traders tiles are static market metrics. */
export function MarketStatus() {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const status = live?.status ?? "LIVE";
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Market status</h2>
        <span className={`inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-label font-semibold uppercase tracking-micro ring-1 ring-inset ${PILL[status]}`}>
          {status === "HALTED" && <span className="h-1.5 w-1.5 rounded-full bg-halt" />}
          {status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        {TILES.map((t) => (
          <div key={t.label} className="rounded-lg bg-bg p-2 ring-1 ring-inset ring-hairline/60">
            <div className="num text-heading font-bold tabular-nums text-hi">{t.value}</div>
            <div className="mt-0.5 text-label uppercase tracking-wide text-lo">{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
