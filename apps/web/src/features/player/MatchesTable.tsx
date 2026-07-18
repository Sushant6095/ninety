import { TeamCrest } from "../../components/ui/TeamCrest";
import { fmtDate, stageLabel, resultToken, type PlayerProfile, type PlayerMatch } from "./data";

function MatchCell({ m }: { m: PlayerMatch }) {
  const homeWin = m.score?.winner === "HOME_TEAM";
  const awayWin = m.score?.winner === "AWAY_TEAM";
  const team = (t: { code: string; name: string }, win: boolean, right = false) => (
    <span className={`flex min-w-0 items-center gap-1.5 ${right ? "flex-row-reverse" : ""}`}>
      <TeamCrest code={t.code} size={16} />
      <span className={`num truncate text-caption tabular-nums ${win ? "font-semibold text-hi" : "text-lo"}`}>{t.code}</span>
    </span>
  );
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {team(m.home, homeWin)}
      <span className="num shrink-0 rounded bg-hairline/40 px-2 py-0.5 text-caption font-semibold tabular-nums text-hi">
        {m.score ? `${m.score.h}–${m.score.a}` : "—"}
      </span>
      {team(m.away, awayWin, true)}
    </div>
  );
}

export function MatchesTable({ p }: { p: PlayerProfile }) {
  if (p.matchesError) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">
        Match log unavailable for {p.name} — the tournament source didn&apos;t return a result set. No fabricated rows.
      </div>
    );
  }
  if (p.matches.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">
        No completed World Cup matches for {p.name} yet.
      </div>
    );
  }
  return (
    <div>
      <div className="overflow-x-auto rounded-card border border-hairline">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-bg/30">
              <th className="px-3 py-2 text-label uppercase tracking-micro text-lo">Date</th>
              <th className="px-3 py-2 text-label uppercase tracking-micro text-lo">Round</th>
              <th className="px-3 py-2 text-label uppercase tracking-micro text-lo">Match</th>
              <th className="px-3 py-2 text-right text-label uppercase tracking-micro text-lo">Result</th>
            </tr>
          </thead>
          <tbody>
            {p.matches.map((m) => {
              const rt = resultToken(m.result);
              return (
                <tr key={m.id} className="border-b border-hairline last:border-0 transition-colors duration-150 hover:bg-hairline/10">
                  <td className="whitespace-nowrap px-3 py-2.5 num text-caption tabular-nums text-lo">{fmtDate(m.date)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-caption text-lo">{stageLabel(m.stage)}</td>
                  <td className="min-w-[180px] px-3 py-2.5">
                    <MatchCell m={m} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={`num inline-grid h-6 w-6 place-items-center rounded-chip text-label font-semibold tabular-nums ring-1 ring-inset ring-hairline ${rt.cls}`}>{rt.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-label text-lo">
        Real full-time World Cup results. Per-match ratings, minutes and player events aren&apos;t sourced on our data tier — shown, never invented.
      </p>
    </div>
  );
}
