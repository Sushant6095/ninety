"use client";
import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";
import { ATTACK } from "../../lib/terminal";

// Signed attack pressure over the last ~30 windows: positive = away/Egypt (bright ink), negative = home (muted ink).
// Green/pink are reserved for price direction only (semantic-color law); the two teams read by ink brightness + sign.
const data = ATTACK.bars.map((v, i) => ({ i, v }));

export function AttackMomentum() {
  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Attack momentum</h2>
        <span className="num flex items-center gap-1 text-label tabular-nums text-lo">
          AUS <span aria-hidden className="text-lo">■</span> EGY <span aria-hidden className="text-hi">■</span>
          <span className="text-hairline">·</span>
          <span className="text-up">LIVE</span>
        </span>
      </div>

      <div className="px-4">
        <div className="h-[90px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap={2} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
              <Bar dataKey="v" isAnimationActive={false} radius={1}>
                {data.map((d) => (
                  <Cell key={d.i} fill={d.v >= 0 ? "var(--text-hi)" : "var(--text-lo)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pb-3 pt-1">
          <span className="text-label font-semibold uppercase tracking-[0.1em] text-hi">
            <span aria-hidden>▶</span> {ATTACK.attacking} attacking
          </span>
          <span className="num text-label uppercase tracking-[0.1em] text-lo">Ball in play {ATTACK.ballInPlay}</span>
        </div>
      </div>
    </section>
  );
}
