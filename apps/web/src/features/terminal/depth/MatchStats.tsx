import { MATCH_STATS, type StatRow } from "../../../lib/matchdepth";

// Sofascore-style stat row: home value | label | away value, with a two-tone proportional bar. Swaps 1:1 for
// api-football v3 `fixtures/statistics` (per-team {type, value}).
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
        <span className="h-full rounded-l-full bg-up/70" style={{ width: `${homePct}%` }} />
        <span className="h-full flex-1 rounded-r-full bg-down/60" />
      </div>
    </li>
  );
}

export function MatchStats() {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2 text-label font-semibold uppercase tracking-wide text-lo">
        <span className="text-up">AUS</span>
        <span>Match stats</span>
        <span className="text-down">EGY</span>
      </div>
      <ul className="divide-y divide-hairline/50">
        {MATCH_STATS.map((s) => <Row key={s.label} s={s} />)}
      </ul>
    </div>
  );
}
