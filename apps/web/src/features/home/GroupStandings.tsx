"use client";
import { Tabs } from "radix-ui";
import { Flag } from "../../components/ui/Flag";
import { teamName } from "../../lib/fixtures";
import { GROUP_STANDINGS, type GroupTable } from "../../lib/rankings";

const COLS = "grid-cols-[18px_1fr_repeat(4,22px)_34px_30px]";

function Table({ t }: { t: GroupTable }) {
  return (
    <div>
      <div className={`grid ${COLS} items-center gap-2 border-b border-hairline px-4 py-1.5 text-label font-semibold uppercase tracking-wide text-lo`}>
        <span>#</span><span>Team</span>
        <span className="text-center">P</span><span className="text-center">W</span><span className="text-center">D</span><span className="text-center">L</span>
        <span className="text-center">GD</span><span className="text-right">Pts</span>
      </div>
      <ul className="divide-y divide-hairline/60">
        {t.rows.map((row, i) => {
          const gd = row.gf - row.ga;
          const q = i < 2;
          return (
            <li key={row.code} className={`grid ${COLS} items-center gap-2 px-4 py-2 ${q ? "bg-up/[0.04]" : ""}`}>
              <span className={`num text-caption font-semibold tabular-nums ${q ? "text-up" : "text-lo"}`}>{i + 1}</span>
              <span className="flex min-w-0 items-center gap-2">
                <Flag code={row.code} size={18} />
                <span className="truncate text-body font-medium text-hi">{teamName(row.code)}</span>
              </span>
              <span className="num text-center text-caption tabular-nums text-lo">{row.p}</span>
              <span className="num text-center text-caption tabular-nums text-hi/80">{row.w}</span>
              <span className="num text-center text-caption tabular-nums text-hi/80">{row.d}</span>
              <span className="num text-center text-caption tabular-nums text-hi/80">{row.l}</span>
              <span className={`num text-center text-caption tabular-nums ${gd > 0 ? "text-up" : gd < 0 ? "text-down" : "text-lo"}`}>{gd > 0 ? "+" : ""}{gd}</span>
              <span className="num text-right text-caption font-semibold tabular-nums text-hi">{row.pts}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** WC26 group standings — all groups, tabbed (Sofascore pattern) via radix Tabs. Top two per group highlighted. */
export function GroupStandings() {
  return (
    <section className="elev mt-3 overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Group standings</h2>
        <span className="text-label uppercase tracking-wide text-lo">Top 2 advance</span>
      </div>
      <Tabs.Root defaultValue={GROUP_STANDINGS[0].group}>
        <Tabs.List aria-label="Groups" className="flex items-center gap-1 overflow-x-auto border-b border-hairline px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GROUP_STANDINGS.map((g) => (
            <Tabs.Trigger
              key={g.group}
              value={g.group}
              className="relative whitespace-nowrap px-3 py-2 text-caption font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi data-[state=active]:text-hi after:absolute after:inset-x-3 after:-bottom-px after:h-[2px] after:rounded-full after:bg-up after:opacity-0 data-[state=active]:after:opacity-100"
            >
              Group {g.group}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {GROUP_STANDINGS.map((g) => (
          <Tabs.Content key={g.group} value={g.group} className="outline-none">
            <Table t={g} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </section>
  );
}
