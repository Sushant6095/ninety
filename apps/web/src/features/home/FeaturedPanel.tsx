import Link from "next/link";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { routes } from "../../lib/routes";
import type { MarketRow } from "../../lib/types";

const cell = (label: string, price: number, lead: boolean) => (
  <div key={label} className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 ring-1 ring-inset ${lead ? "bg-hairline/40 ring-hairline" : "bg-bg/50 ring-hairline/60"}`}>
    <span className="text-[9px] font-medium uppercase tracking-wide text-lo">{label}</span>
    <span className={`num text-[17px] font-bold tabular-nums ${lead ? "text-hi" : "text-hi/90"}`}>{price.toFixed(1)}</span>
  </div>
);

/** Featured live match — the right-rail hero. Read-only market + River + big prices; the CTA links to the match
 *  (the trade action itself is deferred, ADR-042/BLOCKED B1). */
export function FeaturedPanel({ market }: { market: MarketRow }) {
  const m = market;
  const mk = m.mark ?? { H: 0, D: 0, A: 0 };
  const lead = mk.H >= mk.D && mk.H >= mk.A ? "H" : mk.A >= mk.D ? "A" : "D";
  const rising = m.spark.length > 1 && m.spark[m.spark.length - 1] >= m.spark[0];

  return (
    <section className="overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Featured — Live</h2>
        <span className="num inline-flex items-center gap-1.5 text-[11px] text-up">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
          {m.minute}&#39;
        </span>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-bg text-[18px] ring-1 ring-inset ring-hairline">{m.homeFlag}</span>
        <span className="num font-display text-[30px] font-extrabold tabular-nums text-hi">
          {m.score?.home} <span className="text-lo">–</span> {m.score?.away}
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-bg text-[18px] ring-1 ring-inset ring-hairline">{m.awayFlag}</span>
      </div>

      <div className="px-1">
        <MomentumRiver data={m.spark} up={rising} height={92} goalIndex={13} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 px-3 pt-1">
        {cell("Home", mk.H * 100, lead === "H")}
        {cell("Draw", mk.D * 100, lead === "D")}
        {cell("Away", mk.A * 100, lead === "A")}
      </div>

      <div className="p-3 pt-2.5">
        <Link
          href={routes.match(m.matchId)}
          className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-up px-4 py-2.5 text-[14px] font-semibold text-bg transition-[filter,transform] duration-200 ease-out hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Trade this match
        </Link>
      </div>
    </section>
  );
}
