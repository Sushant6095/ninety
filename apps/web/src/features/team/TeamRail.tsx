import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { ClubCrest } from "./Crest";
import { type TeamProfile } from "./data";

/** A related-teams rail — group-mates (nations) or league clubs (clubs). Every link resolves to a baked team page,
 *  so the board's "two real team pages per match" story holds and there are no dead ends. Server-passed. */
export function TeamRail({ current, related }: { current: TeamProfile; related: TeamProfile[] }) {
  if (related.length === 0) return null;
  const heading = current.kind === "nation" && current.group ? `Also in Group ${current.group}` : "More clubs";
  return (
    <section>
      <h2 className="mb-3 text-strong font-semibold text-hi">{heading}</h2>
      <ul className="grid gap-2 sm:grid-cols-3">
        {related.map((r) => (
          <li key={r.code}>
            <Link
              href={`/team/${r.code}`}
              className="flex items-center gap-3 rounded-card border border-hairline bg-surface px-3 py-2.5 transition-colors duration-150 hover:border-up/40 hover:bg-hairline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50"
            >
              {r.kind === "club" && r.crest ? <ClubCrest src={r.crest} name={r.name} size={24} /> : r.fifaCode ? <TeamCrest code={r.fifaCode} size={24} /> : null}
              <span className="min-w-0">
                <span className="block truncate text-caption font-medium text-hi">{r.shortName ?? r.name}</span>
                <span className="block text-label uppercase tracking-micro text-lo">{r.kind === "nation" ? r.country : "Club"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
