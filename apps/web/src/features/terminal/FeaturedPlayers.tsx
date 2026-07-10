"use client";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { FEATURED_PLAYERS } from "../../lib/terminal";

const { home, away } = FEATURED_PLAYERS;
const data = [
  { axis: "ATT", home: home.att, away: away.att },
  { axis: "DEF", home: home.def, away: away.def },
  { axis: "TEC", home: home.tec, away: away.tec },
];

/** Featured players — the two standouts + an attribute radar (ATT/DEF/TEC), home=green, away=pink (North Star). */
export function FeaturedPlayers() {
  return (
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Featured players</h2>
        <span className="text-[9px] uppercase tracking-wide text-lo/70">This match</span>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-bg text-[10px] font-semibold text-hi ring-1 ring-inset ring-up/40">{home.code}</span>
          <div><div className="text-[12px] font-medium text-hi">{home.name}</div><div className="num text-[10px] text-up">{home.rating.toFixed(1)}</div></div>
        </div>
        <span className="text-[9px] text-lo">vs</span>
        <div className="flex items-center gap-2 text-right">
          <div><div className="text-[12px] font-medium text-hi">{away.name}</div><div className="num text-[10px] text-down">{away.rating.toFixed(1)}</div></div>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-bg text-[10px] font-semibold text-hi ring-1 ring-inset ring-down/40">{away.code}</span>
        </div>
      </div>
      <div className="h-[160px] px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="68%">
            <PolarGrid stroke="var(--hairline)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-lo)", fontSize: 9 }} />
            <Radar dataKey="home" stroke="var(--up)" fill="var(--up)" fillOpacity={0.16} isAnimationActive={false} />
            <Radar dataKey="away" stroke="var(--down)" fill="var(--down)" fillOpacity={0.16} isAnimationActive={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
