"use client";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { PORTFOLIO } from "../../lib/terminal";

/** Right-rail account summary: equity + free credits, with a 7-day equity sparkline (inline SVG, not a chart lib). */
export function PortfolioCard() {
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Portfolio</h2>
        <span className="num text-label font-semibold tabular-nums text-up">
          +{PORTFOLIO.changePct.toFixed(1)}% · 7D
        </span>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="num text-display font-bold tabular-nums leading-none text-hi">
              {PORTFOLIO.equity.toLocaleString("en-US")}
            </span>
            <span className="text-label text-lo">equity cr</span>
          </div>
          <span className="num text-label tabular-nums text-lo">
            {PORTFOLIO.free.toLocaleString("en-US")} free
          </span>
        </div>
        <div className="mt-3 h-12">
          <EquityCurve values={PORTFOLIO.spark} up height={48} className="h-12" quiet />
        </div>
      </div>
    </section>
  );
}
