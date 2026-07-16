import Image from "next/image";
import { Star } from "lucide-react";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { teamMediaByCode } from "../../lib/teamMedia";
import type { TerminalMatch } from "../../lib/terminal";

interface MatchLive {
  score: { home: number; away: number } | null; // null before kickoff — shows "vs" instead of a scoreline
  minute: number | null; // null before kickoff — the live-minute pip is hidden, only the phase shows
  phase: string;
  scorer: string; // "" hides the scorer line (pre-goal)
  status: string; // "LIVE" | "HALTED" …
}

/** Center header for the selected market — breadcrumb, both sides with FIFA/group meta, live score + status.
 *  `live` is REQUIRED and comes straight from the store: there is deliberately no fixture fallback, because a
 *  fallback is how the header ends up narrating a different minute than the River (ADR-055). `match` holds only
 *  the still parts — names, badges, venue.
 *
 *  ATMOSPHERE: the backdrop is the HOME side's baked crowd/stadium shot (TheSportsDB strFanart1), dimmed under a
 *  scrim so the numbers stay legible. It is team atmosphere, not a venue claim — the free tier has no image for a
 *  neutral WC26 venue (MetLife/Lumen), so the venue NAME stays the authoritative text (ADR-062). */
export function MatchHeader({ match, live }: { match: TerminalMatch; live: MatchLive }) {
  const { score, minute, phase, scorer, status } = live;
  const atmosphere = teamMediaByCode(match.homeCode)?.stadium ?? null;
  return (
    <div className="relative overflow-hidden border-b border-hairline px-4 py-3">
      {atmosphere && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <Image src={atmosphere} alt="" fill sizes="100vw" className="object-cover object-center opacity-10" />
          {/* legibility scrim (the sanctioned exception to the no-gradient law — never decorative): fade the
              atmosphere back to the surface token so the tape/score stay ≥4.5:1 */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/85 to-surface" />
        </div>
      )}

      <div className="relative z-10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <nav className="flex items-center gap-1 truncate text-label text-lo" aria-label="Breadcrumb">
          <span>Football</span><span className="text-lo/50">›</span>
          <span>{match.competition}</span><span className="text-lo/50">›</span>
          <span className="text-hi">{match.stage} · {match.home} vs {match.away}</span>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-chip bg-surface px-2 py-1 text-label font-semibold uppercase tracking-tag ring-1 ring-inset transition-colors duration-200 ${status === "HALTED" ? "text-halt ring-halt/40" : "text-lo ring-hairline"}`}>Market {status}</span>
          <button className="hit inline-flex items-center gap-1 rounded-chip bg-surface px-2 py-1 text-label text-lo ring-1 ring-inset ring-hairline transition-colors duration-200 hover:text-hi">
            <Star size={12} className="text-up" aria-hidden /> Favourite
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <TeamCrest code={match.homeCode} size={48} priority />
          <div className="min-w-0">
            <div className="truncate text-body font-semibold text-hi sm:text-heading">{match.home}</div>
            <div className="num text-label uppercase tracking-wide text-lo">{match.homeMeta}</div>
          </div>
        </div>

        <div className="shrink-0 text-center">
          {score ? (
            <div className="num font-display text-display-xl font-extrabold leading-none tabular-nums text-hi">
              {score.home}<span className="px-2 text-lo">–</span>{score.away}
            </div>
          ) : (
            <div className="num font-display text-display-xl font-extrabold leading-none tabular-nums text-lo/60">vs</div>
          )}
          <div className="num mt-1 flex items-center justify-center gap-2 text-label uppercase tracking-wide text-lo">
            {minute != null && (
              <span className="inline-flex items-center gap-1 text-up"><span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />{minute}&#39;</span>
            )}
            <span>{phase}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="truncate text-body font-semibold text-hi sm:text-heading">{match.away}</div>
            <div className="num text-label uppercase tracking-wide text-lo">{match.awayMeta}</div>
          </div>
          <TeamCrest code={match.awayCode} size={48} priority />
        </div>
      </div>

      {(scorer || match.venue) && (
        <div className="num mt-2 flex items-center justify-center gap-2 text-label uppercase tracking-wide text-lo/80">
          {scorer && <><span className="text-hi">{scorer}</span><span className="text-lo/40">·</span></>}<span>{match.venue}</span>
        </div>
      )}
      </div>
    </div>
  );
}
