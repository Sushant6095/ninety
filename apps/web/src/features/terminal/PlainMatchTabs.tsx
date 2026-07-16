"use client";
import { Tabs } from "radix-ui";
import { SquadPitch } from "./depth/Lineups";
import type { PositionRow } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";
import { fmtPrice, signedCR } from "../../lib/format";

// Non-featured depth tabs — the HONEST subset. We only surface what's actually true for an arbitrary market:
// the real baked squads (Lineups) and your live positions. Stats / H2H / Events / Booth are AUS-EGY-only
// fixtures on the featured MatchTabs, so they are deliberately absent here rather than shown under the wrong
// match (the credibility law: never AUS-EGY data under another match's header).
const TABS = [
  { v: "lineups", l: "Lineups" },
  { v: "positions", l: "Positions" },
];

const TRIGGER =
  "relative inline-flex min-h-[44px] shrink-0 items-center rounded-md px-3 text-caption font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up data-[state=active]:text-hi after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-up after:opacity-0 after:transition-opacity after:duration-200 data-[state=active]:after:opacity-100";

/** Depth tabs for a non-featured market: real squads + your positions, keyed by the two team codes. */
export function PlainMatchTabs({
  homeCode,
  awayCode,
  positions,
  mark,
}: {
  homeCode: string;
  awayCode: string;
  positions: PositionRow[];
  mark: Record<Outcome, number>;
}) {
  return (
    <Tabs.Root defaultValue="lineups">
      <Tabs.List aria-label="Match details" className="flex items-center gap-1 overflow-x-auto border-b border-hairline px-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => <Tabs.Trigger key={t.v} value={t.v} className={TRIGGER}>{t.l}</Tabs.Trigger>)}
      </Tabs.List>

      <Tabs.Content value="lineups" className="tab-fade outline-none">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <SquadPitch code={homeCode} />
          <SquadPitch code={awayCode} />
        </div>
      </Tabs.Content>

      <Tabs.Content value="positions" className="tab-fade outline-none">
        {positions.length === 0 ? (
          <p className="px-4 py-10 text-center text-body leading-relaxed text-lo">No position in this match yet — arm an outcome above to trade.</p>
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
