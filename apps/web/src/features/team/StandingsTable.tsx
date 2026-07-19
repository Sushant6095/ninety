import Link from "next/link";
import { SideCrest } from "./Crest";
import { zoneBorder, type TeamProfile, type StandingsGroup, type StandingRow } from "./data";

const isSelf = (row: StandingRow, t: TeamProfile): boolean =>
  t.kind === "nation" ? !!t.fifaCode && row.code === t.fifaCode : t.fdId != null && row.teamId === String(t.fdId);

const NUM_TH = "px-2 py-2 text-right text-label uppercase tracking-micro text-lo";
const NUM_TD = "num px-2 py-2 text-right tabular-nums";

// No per-row Last-5 column: the free tier returns no `form`, and the wide strip clipped in the narrow rail. The
// current team's real Last-5 lives in the dedicated Recent-form panel instead — richer, and never invented for rivals.
function Group({ g, t }: { g: StandingsGroup; t: TeamProfile }) {
  const linkable = t.kind === "nation"; // group rows are all baked WC26 nations; league rows would 404
  return (
    <div className="overflow-hidden rounded-card border border-hairline">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hairline bg-bg/30 px-3 py-2.5">
        <span className="text-caption font-semibold text-hi">
          {g.competition}
          {g.groupName ? ` · ${g.groupName}` : ""}
        </span>
        <span className="text-label uppercase tracking-micro text-lo">{g.note}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th className="px-2 py-2 text-label uppercase tracking-micro text-lo">#</th>
              <th className="px-2 py-2 text-label uppercase tracking-micro text-lo">Team</th>
              <th className={NUM_TH}>P</th>
              <th className={NUM_TH}>W</th>
              <th className={NUM_TH}>D</th>
              <th className={NUM_TH}>L</th>
              <th className={`${NUM_TH} hidden sm:table-cell`}>GLS</th>
              <th className={NUM_TH}>DIFF</th>
              <th className={NUM_TH}>PTS</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((row) => {
              const self = isSelf(row, t);
              // Skip the crest for non-self league rows (they have no baked crest — a "?" disc ×20 is noise).
              const showCrest = self || !!row.code;
              const teamCell = (
                <span className="flex min-w-0 items-center gap-2">
                  {showCrest ? <SideCrest code={row.code} size={18} name={row.name} localCrest={self ? t.crest : null} /> : null}
                  <span className={`truncate text-caption ${self ? "font-semibold text-hi" : "text-lo"}`}>{row.name}</span>
                </span>
              );
              return (
                <tr key={row.teamId || row.position} className={`border-b border-hairline last:border-0 ${zoneBorder(row.zone)} ${self ? "bg-hairline/20" : "transition-colors duration-150 hover:bg-hairline/10"}`}>
                  <td className="num px-2 py-2 tabular-nums text-lo">{row.position}</td>
                  <td className="min-w-[150px] px-2 py-2">
                    {linkable && row.code ? (
                      <Link href={`/team/${row.code}`} className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50">
                        {teamCell}
                      </Link>
                    ) : (
                      teamCell
                    )}
                  </td>
                  <td className={`${NUM_TD} text-lo`}>{row.played}</td>
                  <td className={`${NUM_TD} text-lo`}>{row.won}</td>
                  <td className={`${NUM_TD} text-lo`}>{row.draw}</td>
                  <td className={`${NUM_TD} text-lo`}>{row.lost}</td>
                  <td className={`${NUM_TD} hidden text-lo sm:table-cell`}>
                    {row.gf}:{row.ga}
                  </td>
                  <td className={`${NUM_TD} text-lo`}>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                  <td className={`${NUM_TD} font-semibold text-hi`}>{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** The group/league table(s) this team sits in — P W D L GLS DIFF PTS, current row highlighted, qualification zones
 *  as a token-coloured left border (--up advance · --down eliminated). Honest empty state if the source had none. */
export function StandingsTable({ t }: { t: TeamProfile }) {
  if (t.standings.length === 0) {
    return <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">No table available for {t.name} on our data tier.</div>;
  }
  return (
    <div className="flex flex-col gap-5">
      {t.standings.map((g) => (
        <Group key={`${g.competition}-${g.groupName ?? ""}`} g={g} t={t} />
      ))}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label text-lo">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-up" /> Advancing
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-down" /> Eliminated
        </span>
        <span>Real full-time results. The current team&apos;s last-5 form is in the Recent-form panel.</span>
      </p>
    </div>
  );
}
