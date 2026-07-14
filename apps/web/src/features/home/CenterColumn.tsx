"use client";
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motion as m } from "../../design/motion";
import { MatchList } from "./MatchList";
import { useMatchLiveList, type MatchStatus } from "../live/matchLiveStore";
import type { MarketRow } from "../../lib/types";

type FilterKey = "live" | "upcoming" | "finished";

// The filter chip a match belongs to, derived from its ONE-store lifecycle status (never the seed row).
const CATEGORY: Record<MatchStatus, FilterKey> = { LIVE: "live", HALTED: "live", PRE: "upcoming", SETTLED: "finished" };
const EMPTY_COPY: Record<FilterKey, string> = {
  live: "No live matches right now.",
  upcoming: "No upcoming matches on today’s slate.",
  finished: "No settled matches yet today.",
};
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "finished", label: "Finished" },
];

// Three-day nav — the middle day is today (visual, like the lock-kit board).
const DAYS = [
  // Today is Jul 4 — the live R16 kickoffs (fixtures.ts) are dated 2026-07-04; a strip that calls Jul 5
  // "today" while matches kicked off "yesterday" fails the read-out-loud test.
  { label: "Fri Jul 3", today: false },
  { label: "Today · Sat Jul 4", today: true },
  { label: "Sun Jul 5", today: false },
];

interface CenterColumnProps {
  markets: MarketRow[];
  children?: ReactNode; // modules below the board (movers / traders / news)
}

export function CenterColumn({ markets, children }: CenterColumnProps) {
  const [filter, setFilter] = useState<FilterKey>("live");
  const reduce = useReducedMotion();

  const statusById = new Map(useMatchLiveList().map((s) => [s.matchId, s.status]));
  const catOf = (m: MarketRow): FilterKey => CATEGORY[statusById.get(m.matchId) ?? "PRE"];

  const counts: Record<FilterKey, number> = {
    live: markets.filter((m) => catOf(m) === "live").length,
    upcoming: markets.filter((m) => catOf(m) === "upcoming").length,
    finished: markets.filter((m) => catOf(m) === "finished").length,
  };
  const filtered = markets.filter((m) => catOf(m) === filter);

  return (
    // The board card CLOSES after the match list. The sections below it (movers, standings, the Booth) are
    // SIBLINGS — they used to render inside this card, which meant the board's "Live · Sorted by kick-off"
    // filter header visually governed the group-standings table and the trader cards. It never governed them.
    <div className="flex min-w-0 flex-col gap-3">
      <div className="elev min-w-0 rounded-card border border-hairline/70 bg-surface">
      {/* Date nav. The slate only carries today, so the other days are honestly DISABLED rather than dressed up
          as controls that hover, focus and then do nothing when a judge clicks them. */}
      <div className="flex items-center gap-1 border-b border-hairline px-3 py-2">
        <button type="button" disabled aria-label="Previous day" className="grid h-11 w-8 place-items-center rounded-md text-body text-lo/50 disabled:cursor-not-allowed">‹</button>
        {DAYS.map((d) => (
          <button
            key={d.label}
            type="button"
            disabled={!d.today}
            aria-current={d.today ? "date" : undefined}
            className={`num min-h-[44px] whitespace-nowrap rounded-md px-3 py-1 text-label font-medium uppercase tracking-wide transition-colors duration-200 ${
              d.today ? "bg-hairline/60 text-hi" : "text-lo/50 disabled:cursor-not-allowed"
            }`}
          >
            {d.label}
          </button>
        ))}
        <button type="button" disabled aria-label="Next day" className="grid h-11 w-8 place-items-center rounded-md text-body text-lo/50 disabled:cursor-not-allowed">›</button>
        <span className="num ml-auto hidden text-label tracking-wide text-lo sm:block">KICK-OFF TIMES UTC</span>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={on}
              className={`relative inline-flex shrink-0 items-center gap-1 rounded-chip px-3 py-2 text-caption font-medium outline-none transition-[color,transform] duration-200 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                on ? "text-bg" : "bg-bg text-lo ring-1 ring-inset ring-hairline hover:text-hi"
              }`}
            >
              {on && (
                <motion.span
                  layoutId="homeFilterActive"
                  className="absolute inset-0 rounded-chip bg-hi"
                  transition={reduce ? { duration: 0 } : m.spring}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1">
                {f.key === "live" && <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-bg" : "bg-up"}`} />}
                {f.label}
                <span className="num opacity-70">{counts[f.key]}</span>
              </span>
            </button>
          );
        })}
        <span className="ml-auto shrink-0 whitespace-nowrap pl-3 text-label text-lo">Sorted by kick-off</span>
      </div>

        <div className="min-h-[120px] border-t border-hairline">
          <MatchList markets={filtered} emptyLabel={EMPTY_COPY[filter]} />
        </div>
      </div>
      {children}
    </div>
  );
}
