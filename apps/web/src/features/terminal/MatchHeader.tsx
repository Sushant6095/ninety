import { Star } from "lucide-react";
import { Flag } from "../../components/ui/Flag";
import type { TerminalMatch } from "../../lib/terminal";

interface MatchLive {
  score: { home: number; away: number };
  minute: number;
  phase: string;
  scorer: string; // "" hides the scorer line (pre-goal)
  status: string; // "LIVE" | "HALTED" …
}

/** Center header for the selected market — breadcrumb, both sides with FIFA/group meta, live score + status.
 *  `live` is REQUIRED and comes straight from the store: there is deliberately no fixture fallback, because a
 *  fallback is how the header ends up narrating a different minute than the River (ADR-055). `match` holds only
 *  the still parts — names, badges, venue. */
export function MatchHeader({ match, live }: { match: TerminalMatch; live: MatchLive }) {
  const { score, minute, phase, scorer, status } = live;
  return (
    <div className="border-b border-hairline px-4 py-3">
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
          <Flag code={match.homeCode} size={40} />
          <div className="min-w-0">
            <div className="truncate text-body font-semibold text-hi sm:text-heading">{match.home}</div>
            <div className="num text-label uppercase tracking-wide text-lo">{match.homeMeta}</div>
          </div>
        </div>

        <div className="shrink-0 text-center">
          <div className="num font-display text-display-xl font-extrabold leading-none tabular-nums text-hi">
            {score.home}<span className="px-2 text-lo">–</span>{score.away}
          </div>
          <div className="num mt-1 flex items-center justify-center gap-2 text-label uppercase tracking-wide text-lo">
            <span className="inline-flex items-center gap-1 text-up"><span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />{minute}&#39;</span>
            <span>{phase}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="truncate text-body font-semibold text-hi sm:text-heading">{match.away}</div>
            <div className="num text-label uppercase tracking-wide text-lo">{match.awayMeta}</div>
          </div>
          <Flag code={match.awayCode} size={40} />
        </div>
      </div>

      <div className="num mt-2 flex items-center justify-center gap-2 text-label uppercase tracking-wide text-lo/80">
        {scorer && <><span className="text-hi">{scorer}</span><span className="text-lo/40">·</span></>}<span>{match.venue}</span>
      </div>
    </div>
  );
}
