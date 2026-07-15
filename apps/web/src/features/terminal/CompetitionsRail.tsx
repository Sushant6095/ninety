"use client";
import { useState } from "react";
import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { LivePrice } from "../../components/ui/LivePrice";
import { ScrollArea } from "../../components/ui/ScrollArea";
import { useMatchLive } from "../live/matchLiveStore";
import { routes } from "../../lib/routes";
import { TERM_MARKETS, type TermMarketRow } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

const OUT: Outcome[] = ["H", "D", "A"];
// One source of truth for the screener's column geometry — Row and the header row both consume these,
// so a width edit can never misalign them. 456px = 8 rows (Hyperliquid watchlist cap).
const COL = { star: "w-3", min: "w-9", price: "min-w-[34px]" } as const;
const RAIL_MAX_H = "max-h-[456px]";
type RailFilter = "all" | "live" | "faves";

function leadOf(mark: Record<Outcome, number>): Outcome {
  return mark.H >= mark.D && mark.H >= mark.A ? "H" : mark.A >= mark.D ? "A" : "D";
}

/** One rail row. Its minute, score and prices come from the ONE store — this rail lists the SAME match the
 *  centre column is trading, so a fixture read here is a guaranteed contradiction the moment the goal lands.
 *  Column labels live in the header row (screener pattern), so each price cell is just the number — denser. */
function Row({ m }: { m: TermMarketRow }) {
  const live = useMatchLive(m.matchId);
  const mark = live?.prices ?? m.mark;
  const minute = live?.minute ?? m.minute;
  const score = live?.score ? [live.score.home, live.score.away] : m.score;
  const halted = live?.status === "HALTED";
  const lead = leadOf(mark);
  return (
    <Link
      href={routes.match(m.matchId)}
      aria-current={m.selected ? "true" : undefined}
      className={`group relative flex items-center gap-2 py-2 pl-3 pr-2 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 active:bg-hairline/40 ${m.selected ? "bg-up/[0.06]" : ""}`}
    >
      {m.selected && <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-up" />}
      <span className={`${COL.star} shrink-0 text-center text-caption ${m.fav ? "text-up" : "text-lo/40"}`} aria-hidden>★</span>
      <span className={`${COL.min} shrink-0 text-center`}>
        {minute != null ? (
          <>
            <span className={`num block text-label font-semibold leading-none ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>
            <span className="mt-0.5 block text-label font-medium tracking-micro text-lo">{minute > 45 ? "2H" : "1H"}</span>
          </>
        ) : (
          <span className="num text-label text-lo">{m.time}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1"><TeamCrest code={m.homeCode} size={16} /><span className="text-caption font-medium text-hi">{m.homeCode}</span></span>
        <span className="mt-1 flex items-center gap-1"><TeamCrest code={m.awayCode} size={16} /><span className="text-caption font-medium text-hi">{m.awayCode}</span></span>
      </span>
      {score ? (
        <span className={`${COL.star} shrink-0 text-right`}>
          <span className="num block text-caption font-medium text-hi">{score[0]}</span>
          <span className="num mt-1 block text-caption font-medium text-hi">{score[1]}</span>
        </span>
      ) : (
        <span className={`${COL.star} shrink-0`} aria-hidden />
      )}
      <span className="flex shrink-0 gap-1">
        {OUT.map((o) => (
          <span key={o} className={`flex ${COL.price} items-center justify-center rounded px-1 py-1.5 ${lead === o ? "bg-hairline/50" : "bg-bg/40"}`}>
            <LivePrice value={mark[o] * 100} className="text-caption font-semibold text-hi/90" />
          </span>
        ))}
      </span>
    </Link>
  );
}

const FILTERS: Array<{ key: RailFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "faves", label: "Faves" },
];

/** Left rail — the market screener (hyperscreener structure, Ninety tokens): filter pills, a real column
 *  header row, grouped dense rows. No column sorting on purpose — the round grouping IS the ordering that
 *  carries information here, and Today's Movers already ranks by Δ. */
export function CompetitionsRail() {
  const [filter, setFilter] = useState<RailFilter>("all");
  const match = (m: TermMarketRow): boolean =>
    filter === "all" ? true : filter === "live" ? m.minute != null : m.fav;

  const groups: Array<[string, string, TermMarketRow[]]> = [];
  for (const m of TERM_MARKETS) {
    if (!match(m)) continue;
    const g = groups.find(([label]) => label === m.group);
    if (g) g[2].push(m);
    else groups.push([m.group, m.groupMeta, [m]]);
  }
  const counts: Record<RailFilter, number> = {
    all: TERM_MARKETS.length,
    live: TERM_MARKETS.filter((m) => m.minute != null).length,
    faves: TERM_MARKETS.filter((m) => m.fav).length,
  };

  return (
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-3 py-2">
        <h2 className="flex min-w-0 items-center gap-1 truncate whitespace-nowrap text-label font-semibold uppercase tracking-label text-lo">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" /> Markets
        </h2>
        <div role="group" aria-label="Filter markets" className="inline-flex shrink-0 gap-0.5 rounded-chip bg-bg/50 p-0.5 ring-1 ring-inset ring-hairline/60">
          {FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                className={`hit whitespace-nowrap rounded-chip px-2 py-0.5 text-label font-medium outline-none transition-[color,background-color,transform] duration-200 focus-visible:ring-1 focus-visible:ring-up active:scale-[0.97] ${on ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"}`}
              >
                {f.label} <span className="num tabular-nums">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Column header (screener pattern) — mirrors the row grid exactly; kick-offs are UTC. */}
      <div className="flex items-center gap-2 border-b border-hairline/70 bg-bg/30 py-1.5 pl-3 pr-2 text-label font-semibold uppercase tracking-micro text-lo" aria-hidden>
        <span className={`${COL.star} shrink-0`} />
        <span className={`${COL.min} shrink-0 text-center`}>UTC</span>
        <span className="min-w-0 flex-1">Match</span>
        <span className={`${COL.star} shrink-0`} />
        <span className="flex shrink-0 gap-1">
          {OUT.map((o) => (
            <span key={o} className={`${COL.price} text-center`}>{o}</span>
          ))}
        </span>
      </div>

      {/* The full R16 slate is 13 rows — cap the list at ~8 rows (Hyperliquid watchlist pattern) so Attack
          Momentum and the events feed stay on the first screen; the rail scrolls inside its own hairline bar. */}
      <ScrollArea className={RAIL_MAX_H}>
        {groups.length === 0 ? (
          <p className="px-3 py-6 text-center text-caption text-lo">No {filter === "faves" ? "favourites" : "live matches"} right now.</p>
        ) : (
          groups.map(([label, meta, rows]) => (
            <div key={label}>
              <div className="flex items-center gap-2 bg-bg/40 px-3 py-1">
                <span className="num rounded bg-bg px-1 text-label font-semibold text-lo ring-1 ring-inset ring-hairline">R16</span>
                <h3 className="text-label font-semibold uppercase tracking-micro text-lo">{label}</h3>
                <span className="text-label text-lo">{meta}</span>
              </div>
              <div className="divide-y divide-hairline/50">
                {rows.map((m) => <Row key={m.matchId} m={m} />)}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
      <Link href={routes.competition} className="flex min-h-11 items-center border-t border-hairline px-3 text-label text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi active:opacity-70">
        Tournament futures · 2 markets →
      </Link>
    </section>
  );
}
