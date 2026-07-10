import { BOOTH, BOOTH_TIMELINE, type BoothEvent } from "../../lib/terminal";

function Impact({ e }: { e: BoothEvent }) {
  if (e.repriced) return <span className="num shrink-0 rounded bg-up/12 px-1.5 py-0.5 text-[10px] font-semibold text-up ring-1 ring-inset ring-up/25">{e.repriced}</span>;
  const up = e.delta >= 0;
  const big = Math.abs(e.delta) >= 5;
  return <span className={`num shrink-0 text-[11px] ${up ? "text-up" : "text-down"} ${big ? "font-bold" : "font-medium"}`}>{up ? "▲" : "▼"}{Math.abs(e.delta).toFixed(1)}</span>;
}

/** The Booth — live AI commentary + the market impact each event had (the North Star's richer booth timeline). */
export function BoothTimeline() {
  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-lo">
          <span className="flex items-end gap-[2px]" aria-hidden>
            <span className="h-2 w-[2px] rounded-full bg-up" /><span className="h-3 w-[2px] rounded-full bg-up" /><span className="h-1.5 w-[2px] rounded-full bg-up" /><span className="h-2.5 w-[2px] rounded-full bg-up" />
          </span>
          The Booth · AI commentary
        </h3>
        <span className="num text-[9px] uppercase tracking-wide text-lo">EN · AUTO · Live</span>
      </div>

      <div className="mb-3 rounded-lg bg-bg/50 p-3 ring-1 ring-inset ring-hairline/60">
        <span className="num mb-1 inline-block rounded bg-up/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-up">Playing · 74&#39;</span>
        <p className="text-[13px] leading-snug text-hi">{BOOTH.text}</p>
      </div>

      <ol className="space-y-2.5">
        {BOOTH_TIMELINE.map((e) => (
          <li key={e.minute} className="flex items-start gap-3">
            <span className="num w-7 shrink-0 pt-0.5 text-right text-[11px] text-lo">{e.minute}&#39;</span>
            <p className="min-w-0 flex-1 text-[12px] leading-snug text-hi/90">{e.text}</p>
            <Impact e={e} />
          </li>
        ))}
      </ol>
    </div>
  );
}
