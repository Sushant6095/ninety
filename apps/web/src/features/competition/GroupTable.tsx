import { TeamCrest } from "../../components/ui/TeamCrest";
import { teamById, type WcGroup } from "../../data/wc26";

const QUALIFY = 2; // top two of each group advance to the Round of 32

/** One WC26 group standings table. Static context (worldcup26), never live scores.
 *  Top-two rows are the qualification zone — signalled with a neutral tint (green/pink stay
 *  price-only per the semantic-colour law), not a coloured accent. */
export function GroupTable({ group }: { group: WcGroup }) {
  return (
    <section className="elev overflow-hidden rounded-card border border-hairline bg-surface">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <h2 className="text-strong font-semibold text-hi">Group {group.name}</h2>
        <span className="text-label uppercase tracking-label text-lo">Top {QUALIFY} advance</span>
      </header>
      <table className="w-full text-caption">
        <thead>
          <tr className="text-label uppercase tracking-wide text-lo">
            <th className="py-1.5 pl-4 pr-1 text-left font-medium">#</th>
            <th className="py-1.5 pr-2 text-left font-medium">Team</th>
            <th className="num px-1.5 py-1.5 text-right font-medium">MP</th>
            <th className="num px-1.5 py-1.5 text-right font-medium">W</th>
            <th className="num px-1.5 py-1.5 text-right font-medium">D</th>
            <th className="num px-1.5 py-1.5 text-right font-medium">L</th>
            <th className="num hidden px-1.5 py-1.5 text-right font-medium sm:table-cell">GF</th>
            <th className="num hidden px-1.5 py-1.5 text-right font-medium sm:table-cell">GA</th>
            <th className="num px-1.5 py-1.5 text-right font-medium">GD</th>
            <th className="num py-1.5 pl-1.5 pr-4 text-right font-semibold text-hi">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((s, i) => {
            const team = teamById(s.teamId);
            const advancing = i < QUALIFY;
            return (
              <tr key={s.teamId} className={`border-t border-hairline/60 ${advancing ? "bg-hairline/25" : ""}`}>
                <td className="py-2 pl-4 pr-1">
                  <span className={`num inline-flex h-5 w-5 items-center justify-center rounded-full text-label tabular-nums ${advancing ? "font-semibold text-hi ring-1 ring-inset ring-hairline" : "text-lo"}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-2 pr-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <TeamCrest code={team?.code ?? "?"} size={20} />
                    <span className="truncate text-hi">{team?.name ?? s.teamId}</span>
                    <span className="num hidden text-label text-lo md:inline">{team?.code}</span>
                  </span>
                </td>
                <td className="num px-1.5 py-2 text-right tabular-nums text-lo">{s.mp}</td>
                <td className="num px-1.5 py-2 text-right tabular-nums text-lo">{s.w}</td>
                <td className="num px-1.5 py-2 text-right tabular-nums text-lo">{s.d}</td>
                <td className="num px-1.5 py-2 text-right tabular-nums text-lo">{s.l}</td>
                <td className="num hidden px-1.5 py-2 text-right tabular-nums text-lo sm:table-cell">{s.gf}</td>
                <td className="num hidden px-1.5 py-2 text-right tabular-nums text-lo sm:table-cell">{s.ga}</td>
                <td className="num px-1.5 py-2 text-right tabular-nums text-lo">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                <td className="num py-2 pl-1.5 pr-4 text-right font-semibold tabular-nums text-hi">{s.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
