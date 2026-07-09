"use client";
import { useState, type ReactNode } from "react";

const DATES = [
  { label: "Fri Jul 4", key: "fri" },
  { label: "Today · Sat Jul 5", key: "today" },
  { label: "Sun Jul 6", key: "sun" },
];
const FILTERS = [
  { key: "live", label: "Live", count: 3 },
  { key: "today", label: "Today", count: 8 },
  { key: "finished", label: "Finished", count: 8 },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

interface CenterColumnProps {
  children?: ReactNode; // the grouped match list (chunk 4)
}

export function CenterColumn({ children }: CenterColumnProps) {
  const [date, setDate] = useState("today");
  const [filter, setFilter] = useState<FilterKey>("live");

  return (
    <div className="rounded-card border border-hairline bg-surface">
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-2.5">
        <button aria-label="Previous day" className="grid h-7 w-7 place-items-center rounded-md text-lo transition-colors duration-200 hover:bg-hairline/40 hover:text-hi">‹</button>
        {DATES.map((d) => (
          <button
            key={d.key}
            onClick={() => setDate(d.key)}
            aria-pressed={date === d.key}
            className={`num rounded-md px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors duration-200 ${
              date === d.key ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"
            }`}
          >
            {d.label.toUpperCase()}
          </button>
        ))}
        <button aria-label="Next day" className="grid h-7 w-7 place-items-center rounded-md text-lo transition-colors duration-200 hover:bg-hairline/40 hover:text-hi">›</button>
        <span className="num ml-auto hidden text-[10px] tracking-wide text-lo sm:block">KICK-OFF TIMES PT</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-[12px] font-medium transition-colors duration-200 ${
              filter === f.key ? "bg-hi text-bg" : "bg-bg text-lo ring-1 ring-inset ring-hairline hover:text-hi"
            }`}
          >
            {f.key === "live" && <span className={`h-1.5 w-1.5 rounded-full ${filter === f.key ? "bg-up" : "bg-up"}`} />}
            {f.label}
            <span className="num opacity-70">{f.count}</span>
          </button>
        ))}
        <span className="ml-auto text-[11px] text-lo">Sorted by kick-off</span>
      </div>

      <div className="min-h-[120px]">{children}</div>
    </div>
  );
}
