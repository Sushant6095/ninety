import { SideCrest } from "./Crest";
import { recentForm, resultToken, opponentOf, fmtDate, type TeamProfile } from "./data";

/** Last-5 form — derived from the finished matches (exactly the reference's strip), oldest → newest left-to-right,
 *  each cell an opponent crest under a token-coloured W/D/L chip. No finished matches → the matches panel's empty
 *  state already covers it, so this renders nothing. */
export function RecentForm({ t }: { t: TeamProfile }) {
  const form = recentForm(t, 5).reverse();
  if (form.length === 0) return null;
  return (
    <section className="elev rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-strong font-semibold text-hi">Recent form</h2>
        <span className="text-label uppercase tracking-micro text-lo">last {form.length}</span>
      </div>
      <ol className="mt-4 flex flex-wrap gap-3">
        {form.map(({ match, result }) => {
          const opp = opponentOf(match);
          const rt = resultToken(result);
          const mine = match.side === "home" ? match.score!.h : match.score!.a;
          const theirs = match.side === "home" ? match.score!.a : match.score!.h;
          return (
            <li key={match.id} className="flex flex-col items-center gap-1.5" title={`${opp.name} ${mine}–${theirs} · ${fmtDate(match.date)}`}>
              <span className={`num grid h-8 w-8 place-items-center rounded-chip text-caption font-semibold tabular-nums ring-1 ring-inset ring-hairline ${rt.cls}`}>{rt.label}</span>
              <SideCrest code={opp.code} size={18} name={opp.name} />
              <span className="num text-label tabular-nums text-lo">
                {mine}–{theirs}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
