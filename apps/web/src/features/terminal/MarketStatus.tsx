"use client";
import { useMatchLive, TERMINAL_MATCH_ID, type MatchStatus } from "../live/matchLiveStore";
import { MARKET_STATUS } from "../../lib/terminal";
import { TradersStrip } from "./TradersStrip";

const { tick, feedMs, b } = MARKET_STATUS;

// Three tiles — the traders head-count moved into the TradersStrip below (one number, one place).
const TILES: { value: string; label: string }[] = [
  { value: `${tick.toFixed(1)}s`, label: "TICK" },
  { value: `${feedMs}ms`, label: "FEED" },
  { value: b.toLocaleString("en-US"), label: "LMSR B" },
];

// Status pill styling — amber only while halted (design law: amber = halts).
const PILL: Record<MatchStatus, string> = {
  PRE: "text-lo ring-hairline",
  LIVE: "text-up ring-up/30",
  HALTED: "text-halt ring-halt/50",
  SETTLED: "text-lo ring-hairline",
};

/** Right-rail status card. The status word reads from the ONE store for the OPEN market (so it can never
 *  disagree with the center header / switcher); the tick/feed/B/traders tiles are static market metrics.
 *  `matchId` defaults to the featured market, so /terminal is unchanged; a non-featured /match/:id passes its id. */
export function MarketStatus({ matchId = TERMINAL_MATCH_ID }: { matchId?: string }) {
  const live = useMatchLive(matchId);
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
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        {TILES.map((t) => (
          <div key={t.label} className="rounded-lg bg-bg p-2 ring-1 ring-inset ring-hairline/60">
            <div className="num text-heading font-bold tabular-nums text-hi">{t.value}</div>
            <div className="mt-0.5 text-label uppercase tracking-wide text-lo">{t.label}</div>
          </div>
        ))}
      </div>
      <TradersStrip />
    </section>
  );
}
