import { tallies, selfStandingRow, type TeamProfile } from "./data";

function Stat({ label, value, cls = "text-hi" }: { label: string; value: string | number; cls?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-hairline bg-surface p-4">
      <span className={`num text-display font-semibold leading-none tabular-nums ${cls}`}>{value}</span>
      <span className="text-label uppercase tracking-micro text-lo">{label}</span>
    </div>
  );
}

/** Real, match-derived tournament stats — never invented. Numbers come from the finished-match tallies (and the
 *  standings row for points/position where a table exists). A team with no finished matches shows an honest note. */
export function StatisticsTab({ t }: { t: TeamProfile }) {
  const s = tallies(t);
  const row = selfStandingRow(t);
  if (s.played === 0) {
    return <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">No completed matches yet for {t.name} — nothing to total.</div>;
  }
  const gd = s.gf - s.ga;
  const total = s.won + s.drawn + s.lost || 1;
  const bar = [
    { n: s.won, cls: "bg-up", label: "W" },
    { n: s.drawn, cls: "bg-hairline", label: "D" },
    { n: s.lost, cls: "bg-down", label: "L" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Played" value={s.played} />
        <Stat label="Won" value={s.won} cls="text-up" />
        <Stat label="Drawn" value={s.drawn} />
        <Stat label="Lost" value={s.lost} cls="text-down" />
        <Stat label="Goals for" value={s.gf} />
        <Stat label="Goals against" value={s.ga} />
        <Stat label="Goal diff" value={gd > 0 ? `+${gd}` : gd} cls={gd > 0 ? "text-up" : gd < 0 ? "text-down" : "text-hi"} />
        {row ? <Stat label="Points" value={row.points} /> : <Stat label="Goals / game" value={(s.gf / s.played).toFixed(1)} />}
      </div>

      <div className="rounded-card border border-hairline bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-label uppercase tracking-micro text-lo">Result split</span>
          <span className="num text-label tabular-nums text-lo">
            {s.won}W · {s.drawn}D · {s.lost}L
          </span>
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
          {bar.map((seg) => (seg.n > 0 ? <span key={seg.label} className={seg.cls} style={{ width: `${(seg.n / total) * 100}%` }} title={`${seg.n} ${seg.label}`} /> : null))}
        </div>
      </div>
      <p className="text-label text-lo">Totalled from real full-time results only. Per-match xG, possession and shot data aren&apos;t on our data tier — shown where sourced, never invented.</p>
    </div>
  );
}
