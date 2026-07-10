import { HIGHEST_RATED, type Player } from "../../lib/terminal";

function Row({ p }: { p: Player }) {
  const hot = p.rating >= 7.5;
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bg text-[10px] font-semibold text-hi ring-1 ring-inset ring-hairline">{p.code}</span>
      <span className="truncate text-[13px] text-hi">{p.name}</span>
      <span className={`num ml-auto rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset ${hot ? "bg-up/15 text-up ring-up/25" : "bg-surface text-lo ring-hairline"}`}>{p.rating.toFixed(1)}</span>
    </div>
  );
}

/** Highest-rated players, split home (left) / away (right) — the North Star match-view detail. */
export function HighestRated() {
  const home = HIGHEST_RATED.filter((p) => p.side === "home");
  const away = HIGHEST_RATED.filter((p) => p.side === "away");
  return (
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Highest-rated</h2>
        <span className="num text-[10px] text-lo">74&#39;</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 px-4 pb-3">
        <div>{home.map((p) => <Row key={p.code + p.name} p={p} />)}</div>
        <div>{away.map((p) => <Row key={p.code + p.name} p={p} />)}</div>
      </div>
    </section>
  );
}
