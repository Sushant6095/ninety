"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Flag } from "../../components/ui/Flag";
import { LivePrice } from "../../components/ui/LivePrice";
import { ScrollArea } from "../../components/ui/ScrollArea";
import { useMatchLive } from "../live/matchLiveStore";
import { routes } from "../../lib/routes";
import { TERM_MARKETS, type TermMarketRow } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

const OUT: Outcome[] = ["H", "D", "A"];

function leadOf(mark: Record<Outcome, number>): Outcome {
  return mark.H >= mark.D && mark.H >= mark.A ? "H" : mark.A >= mark.D ? "A" : "D";
}

/** One rail row. Its minute, score and prices come from the ONE store — this rail lists the SAME match the
 *  centre column is trading, so a fixture read here is a guaranteed contradiction the moment the goal lands. */
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
      className={`group relative flex items-center gap-2 py-2 pl-3 pr-2 transition-colors duration-200 hover:bg-hairline/25 ${m.selected ? "bg-up/[0.06]" : ""}`}
    >
      {m.selected && <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-up" />}
      <span className={`w-3 shrink-0 text-center text-caption ${m.fav ? "text-up" : "text-lo/40"}`} aria-hidden>★</span>
      <span className="w-9 shrink-0 text-center">
        {minute != null ? (
          <>
            <span className={`num block text-label font-semibold leading-none ${halted ? "text-halt" : "text-up"}`}>{minute}&#39;</span>
            <span className="mt-0.5 block text-label font-medium tracking-[0.08em] text-lo">{minute > 45 ? "2H" : "1H"}</span>
          </>
        ) : (
          <span className="num text-label text-lo">{m.time}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1"><Flag code={m.homeCode} size={14} /><span className="text-caption font-medium text-hi">{m.homeCode}</span></span>
        <span className="mt-1 flex items-center gap-1"><Flag code={m.awayCode} size={14} /><span className="text-caption font-medium text-hi">{m.awayCode}</span></span>
      </span>
      {score && (
        <span className="w-3 shrink-0 text-right">
          <span className="num block text-caption font-medium text-hi">{score[0]}</span>
          <span className="num mt-1 block text-caption font-medium text-hi">{score[1]}</span>
        </span>
      )}
      <span className="flex shrink-0 gap-1">
        {OUT.map((o) => (
          <span key={o} className={`flex min-w-[30px] flex-col items-center rounded px-1 py-1 ${lead === o ? "bg-hairline/50" : "bg-bg/40"}`}>
            <span className="text-label uppercase text-lo">{o}</span>
            <LivePrice value={mark[o] * 100} className="text-label font-semibold text-hi/90" />
          </span>
        ))}
      </span>
    </Link>
  );
}

/** Left rail — live competitions grouped by round/day, each row a compact market with flags + mini H/D/A prices. */
export function CompetitionsRail() {
  const groups: Array<[string, string, TermMarketRow[]]> = [];
  for (const m of TERM_MARKETS) {
    const g = groups.find(([label]) => label === m.group);
    if (g) g[2].push(m);
    else groups.push([m.group, m.groupMeta, [m]]);
  }
  return (
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
        <h2 className="flex items-center gap-1 text-label font-semibold uppercase tracking-[0.12em] text-lo">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" /> Live competitions
        </h2>
        <span className="text-label uppercase tracking-wide text-lo">All KO times UTC</span>
      </div>
      {/* The full R16 slate is 13 rows — cap the list at ~8 rows (Hyperliquid watchlist pattern) so Attack
          Momentum and the events feed stay on the first screen; the rail scrolls inside its own hairline bar. */}
      <ScrollArea className="max-h-[480px]">
        {groups.map(([label, meta, rows]) => (
          <div key={label}>
            <div className="flex items-center gap-2 bg-bg/40 px-3 py-1">
              <span className="num rounded bg-bg px-1 text-label font-semibold text-lo ring-1 ring-inset ring-hairline">R16</span>
              <h3 className="text-label font-semibold uppercase tracking-[0.08em] text-lo">{label}</h3>
              <span className="text-label text-lo">{meta}</span>
              <ChevronDown size={13} className="ml-auto text-lo/60" aria-hidden />
            </div>
            <div className="divide-y divide-hairline/50">
              {rows.map((m) => <Row key={m.matchId} m={m} />)}
            </div>
          </div>
        ))}
      </ScrollArea>
      <Link href={routes.competition} className="block border-t border-hairline px-3 py-2 text-label text-lo transition-colors duration-200 hover:text-hi">
        Tournament futures · 2 markets →
      </Link>
    </section>
  );
}
