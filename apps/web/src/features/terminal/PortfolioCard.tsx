"use client";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { PORTFOLIO } from "../../lib/terminal";

/** Right-rail account summary: equity + free credits, with a 7-day equity sparkline. */
export function PortfolioCard() {
  const data = PORTFOLIO.spark.map((v) => ({ v }));
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Portfolio</h2>
        <span className="num text-[11px] font-semibold tabular-nums text-up">
          +{PORTFOLIO.changePct.toFixed(1)}% · 7D
        </span>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="num text-[26px] font-bold tabular-nums leading-none text-hi">
              {PORTFOLIO.equity.toLocaleString("en-US")}
            </span>
            <span className="text-[11px] text-lo">equity cr</span>
          </div>
          <span className="num text-[11px] tabular-nums text-lo">
            {PORTFOLIO.free.toLocaleString("en-US")} free
          </span>
        </div>
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--up)"
                strokeWidth={1.5}
                fill="var(--up)"
                fillOpacity={0.12}
                isAnimationActive={false}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
