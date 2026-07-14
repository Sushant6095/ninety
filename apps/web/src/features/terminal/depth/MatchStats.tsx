import { MATCH_STATS, type StatRow } from "../../../lib/matchdepth";

// Sofascore-style stat row: home value | label | away value, with a proportional split bar. Swaps 1:1 for
// api-football v3 `fixtures/statistics` (per-team {type, value}).
//
// Color grammar (dataviz): up/down are RESERVED for price direction on this exchange — a team side may not
// wear them (the rail shows EGY green because its price is up; a green AUS bar 200px away contradicts it).
// Side identity is positional (home left, away right, values at the ends); color carries EMPHASIS only —
// the leading side takes the bright ink, mirroring the hi/lo text treatment on the values themselves.
function Row({ s }: { s: StatRow }) {
  const total = s.home + s.away || 1;
  const homePct = (s.home / total) * 100;
  const homeWins = s.home > s.away;
  const awayWins = s.away > s.home;
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1)) + (s.pct ? "%" : "");
  return (
    <li className="px-4 py-2.5">
      <div className="flex items-center justify-between text-caption">
        <span className={`num font-semibold tabular-nums ${homeWins ? "text-hi" : "text-lo"}`}>{fmt(s.home)}</span>
        <span className="text-lo">{s.label}</span>
        <span className={`num font-semibold tabular-nums ${awayWins ? "text-hi" : "text-lo"}`}>{fmt(s.away)}</span>
      </div>
      <div className="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        <span className={`h-full rounded-l-full ${homeWins ? "bg-hi/60" : "bg-hi/20"}`} style={{ width: `${homePct}%` }} />
        <span className={`h-full flex-1 rounded-r-full ${awayWins ? "bg-hi/60" : "bg-hi/20"}`} />
      </div>
    </li>
  );
}

export function MatchStats() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2 text-label font-semibold uppercase tracking-wide text-lo">
        <span className="text-hi">AUS</span>
        <span>Match stats</span>
        <span className="text-hi">EGY</span>
      </div>
      <ul className="divide-y divide-hairline/50">
        {MATCH_STATS.map((s) => <Row key={s.label} s={s} />)}
      </ul>
    </div>
  );
}
