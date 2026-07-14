"use client";
import { Tabs } from "radix-ui";
import { BoothTimeline } from "./BoothTimeline";
import { MatchStats } from "./depth/MatchStats";
import { Lineups } from "./depth/Lineups";
import { H2H } from "./depth/H2H";
import { EventsTimeline } from "./depth/EventsTimeline";
import type { PositionRow } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";
import { fmtPrice, signedCR } from "../../lib/format";

const TABS = [
  { v: "market", l: "Market" },
  { v: "stats", l: "Stats" },
  { v: "lineups", l: "Lineups" },
  { v: "h2h", l: "H2H" },
  { v: "events", l: "Events" },
  { v: "positions", l: "Positions" },
];

const TRIGGER =
  "relative inline-flex min-h-[44px] shrink-0 items-center rounded-md px-3 text-caption font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up data-[state=active]:text-hi after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-up after:opacity-0 data-[state=active]:after:opacity-100";

function Empty({ text }: { text: string }) {
  return <p className="px-4 py-10 text-center text-body leading-relaxed text-lo">{text}</p>;
}

/** Match-view depth tabs (UI-LOCK §7.1) — Sofascore depth INSIDE the match view, never on the board: Market (the
 *  Booth) · Stats · Lineups · H2H · Events · Positions. Re-skinned radix Tabs. Stats/Lineups/H2H swap 1:1 for api-football v3. */
export function MatchTabs({ positions, mark }: { positions: PositionRow[]; mark: Record<Outcome, number> }) {
  return (
    <Tabs.Root defaultValue="market">
      <Tabs.List aria-label="Match details" className="flex items-center gap-1 overflow-x-auto border-b border-hairline px-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => <Tabs.Trigger key={t.v} value={t.v} className={TRIGGER}>{t.l}</Tabs.Trigger>)}
      </Tabs.List>

      <Tabs.Content value="market" className="outline-none"><BoothTimeline /></Tabs.Content>
      <Tabs.Content value="stats" className="outline-none"><MatchStats /></Tabs.Content>
      <Tabs.Content value="lineups" className="outline-none"><Lineups /></Tabs.Content>
      <Tabs.Content value="h2h" className="outline-none"><H2H /></Tabs.Content>
      <Tabs.Content value="events" className="outline-none"><EventsTimeline /></Tabs.Content>

      <Tabs.Content value="positions" className="outline-none">
        {positions.length === 0 ? (
          <Empty text="No position in this match yet — arm an outcome above to trade." />
        ) : (
          <ul className="divide-y divide-hairline/60">
            {positions.map((p) => {
              const now = mark[p.outcome] * 100;
              const pnl = p.shares * (now - p.avgEntry);
              return (
                <li key={p.outcome} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="num shrink-0 rounded bg-up/15 px-1 text-label font-semibold text-up ring-1 ring-inset ring-up/25">{p.code} · {p.shares} SH</span>
                    <span className="num truncate text-caption tabular-nums text-lo">avg {fmtPrice(p.avgEntry)} → {fmtPrice(now)}</span>
                  </span>
                  <span className={`num shrink-0 text-strong font-semibold tabular-nums ${pnl >= 0 ? "text-up" : "text-down"}`}>{signedCR(pnl)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
