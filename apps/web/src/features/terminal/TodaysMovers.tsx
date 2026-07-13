"use client";
import { Delta } from "../../components/ui/Delta";
import { useMatchLiveList } from "../live/matchLiveStore";
import { MOVERS } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

/** Today's movers — biggest Δ vs open across the R32 board (right rail, bottom). Price and Δ are read from the
 *  ONE store and re-sorted every beat, so Ashour's counter visibly throws EGY to the top of this list while
 *  AUS drops to the bottom. A movers list off a fixture is a movers list that never moves. */
export function TodaysMovers() {
  const live = useMatchLiveList();
  const by = new Map(live.map((m) => [m.matchId, m]));

  const rows = MOVERS.map((m) => {
    const s = by.get(m.matchId);
    if (!s) return m; // not on the live slate — show its seeded opening price, never a zero
    const o: Outcome = m.outcome;
    const price = s.prices[o] * 100;
    return { ...m, price, delta: price - s.openPrices[o] * 100 };
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Today&apos;s movers</h2>
        <span className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Δ vs open</span>
      </div>
      <ul className="px-2 pb-2">
        {rows.map((m) => (
          <li key={`${m.code}-${m.vs}`}>
            <a
              href="/match"
              className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors duration-200 hover:bg-hairline/25"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-hi">
                  {m.code} <span className="text-lo">v</span> {m.vs}
                </span>
                <span className="block truncate text-label text-lo">{m.note}</span>
              </span>
              <span className="num text-body tabular-nums text-hi">{m.price.toFixed(1)}</span>
              <Delta value={m.delta} className="w-[52px] text-right text-caption" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
