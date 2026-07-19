"use client";
// Round history filter (SVAR react-filter, MIT) · GAMING-ONLY (ADR-060 posture): never import
// this into terminal/board/trade surfaces. FilterBar is re-skinned via svar-ninety.css, scoped
// under .games-filter; data-wx-portal-root keeps SVAR's dropdown portals INSIDE the scope so no
// stock chrome can leak. Filtering runs through the library's createArrayFilter over the
// localStorage round log.
import { useMemo, useState } from "react";
import { FilterBar, createArrayFilter, WillowDark } from "@svar-ui/react-filter";
import type { IFilterSet } from "@svar-ui/filter-store";
import "@svar-ui/react-filter/all.css";
import "./svar-ninety.css";
import { MATCH } from "../../lib/terminal";
import { useRoundLog } from "./roundLog";
import type { Pick } from "./nextGoalMachine";

const NOBODY = "Nobody";
const teamOf = (pick: Pick): string => (pick === "H" ? MATCH.homeCode : pick === "A" ? MATCH.awayCode : NOBODY);

interface RoundRow {
  at: number;
  team: string;
  outcome: "correct" | "missed";
  minute: number;
}

const opt = (id: string) => ({ id, label: id });

const FIELDS = [
  { id: "team", label: "Team", type: "text", options: [opt(MATCH.homeCode), opt(MATCH.awayCode), opt(NOBODY)] },
  { id: "outcome", label: "Result", type: "text", options: [opt("correct"), opt("missed")] },
  { id: "minute", label: "Minute", type: "number" },
];

export function RoundFilter() {
  const log = useRoundLog();
  const [filter, setFilter] = useState<IFilterSet | null>(null);

  const rows = useMemo<RoundRow[]>(
    () => log.map((r) => ({ at: r.at, team: teamOf(r.pick), outcome: r.outcome, minute: r.minute })),
    [log],
  );
  const filtered = useMemo(
    () => (filter?.rules?.length ? createArrayFilter(filter)(rows) : rows),
    [filter, rows],
  );

  if (rows.length === 0) {
    return (
      <section aria-label="Past rounds" className="w-full max-w-sm rounded-card border border-hairline/70 bg-surface px-4 py-3">
        <h2 className="text-label font-bold uppercase tracking-[0.16em] text-hi">Past rounds</h2>
        <p className="mt-2 text-caption text-lo">No rounds yet · call a goal above and your history lands here.</p>
      </section>
    );
  }

  return (
    <section aria-label="Past rounds" className="elev w-full max-w-sm overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-baseline justify-between border-b border-hairline/60 px-4 py-2.5">
        <h2 className="text-label font-bold uppercase tracking-[0.16em] text-hi">Past rounds</h2>
        <span className="num text-label font-semibold tabular-nums text-lo">
          {filtered.length}/{rows.length}
        </span>
      </div>

      {/* data-wx-portal-root pins SVAR's popups inside the .games-filter scope (no style leaks). */}
      <div className="games-filter border-b border-hairline/60 px-3 py-2" data-wx-portal-root="true">
        <WillowDark fonts={false}>
          <FilterBar fields={FIELDS} debounce={200} onChange={({ value }) => setFilter(value)} />
        </WillowDark>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-4 text-caption text-lo">No rounds match that filter.</p>
      ) : (
        <ul className="max-h-56 divide-y divide-hairline/60 overflow-y-auto [scrollbar-width:thin]">
          {filtered.map((r) => (
            <li key={r.at} className="flex items-center gap-3 px-4 py-2">
              <span className="num w-9 shrink-0 text-caption font-semibold tabular-nums text-lo">{r.minute}&#39;</span>
              <span className="min-w-0 flex-1 truncate text-caption font-medium text-hi">{r.team}</span>
              <span
                className={`rounded-chip px-2 py-0.5 text-label font-semibold uppercase tracking-[0.1em] ring-1 ring-inset ${
                  r.outcome === "correct" ? "bg-up/10 text-up ring-up/40" : "bg-bg/40 text-lo ring-hairline"
                }`}
              >
                {r.outcome}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
