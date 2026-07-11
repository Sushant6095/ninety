import { Star } from "lucide-react";
import { Flag } from "../../components/ui/Flag";
import type { TerminalMatch } from "../../lib/terminal";

/** Center header for the selected market — breadcrumb, both sides with FIFA/group meta, live score + status. */
export function MatchHeader({ match }: { match: TerminalMatch }) {
  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <nav className="flex items-center gap-1 truncate text-label text-lo" aria-label="Breadcrumb">
          <span>Football</span><span className="text-lo/50">›</span>
          <span>{match.competition}</span><span className="text-lo/50">›</span>
          <span className="text-hi">{match.stage} · {match.home} vs {match.away}</span>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-chip bg-surface px-2 py-1 text-label font-semibold uppercase tracking-[0.1em] text-lo ring-1 ring-inset ring-hairline">Market {match.status}</span>
          <button className="inline-flex items-center gap-1 rounded-chip bg-surface px-2 py-1 text-label text-lo ring-1 ring-inset ring-hairline transition-colors duration-200 hover:text-hi">
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
            {match.score.home}<span className="px-2 text-lo">–</span>{match.score.away}
          </div>
          <div className="num mt-1 flex items-center justify-center gap-2 text-label uppercase tracking-wide text-lo">
            <span className="inline-flex items-center gap-1 text-up"><span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />{match.minute}&#39;</span>
            <span>{match.phase}</span>
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
        <span className="text-hi">{match.scorer}</span><span className="text-lo/40">·</span><span>{match.venue}</span>
      </div>
    </div>
  );
}
