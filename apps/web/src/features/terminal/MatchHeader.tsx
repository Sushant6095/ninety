import { Star } from "lucide-react";
import { Flag } from "../../components/ui/Flag";
import type { TerminalMatch } from "../../lib/terminal";

/** Center header for the selected market — breadcrumb, both sides with FIFA/group meta, live score + status. */
export function MatchHeader({ match }: { match: TerminalMatch }) {
  return (
    <div className="border-b border-hairline px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <nav className="flex items-center gap-1.5 truncate text-[11px] text-lo" aria-label="Breadcrumb">
          <span>Football</span><span className="text-lo/50">›</span>
          <span>{match.competition}</span><span className="text-lo/50">›</span>
          <span className="text-hi">{match.stage} · {match.home} vs {match.away}</span>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-chip bg-up/12 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-up ring-1 ring-inset ring-up/25">Market {match.status}</span>
          <button className="inline-flex items-center gap-1 rounded-chip bg-surface px-2 py-1 text-[11px] text-lo ring-1 ring-inset ring-hairline transition-colors duration-200 hover:text-hi">
            <Star size={12} className="text-up" aria-hidden /> Favourite
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Flag code={match.homeCode} size={40} />
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold text-hi">{match.home}</div>
            <div className="num text-[9px] uppercase tracking-wide text-lo">{match.homeMeta}</div>
          </div>
        </div>

        <div className="shrink-0 text-center">
          <div className="num font-display text-[40px] font-extrabold leading-none tabular-nums text-hi">
            {match.score.home}<span className="px-2 text-lo">–</span>{match.score.away}
          </div>
          <div className="num mt-1.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wide text-lo">
            <span className="inline-flex items-center gap-1 text-up"><span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />{match.minute}&#39;</span>
            <span>{match.phase}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-3 text-right">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-semibold text-hi">{match.away}</div>
            <div className="num text-[9px] uppercase tracking-wide text-lo">{match.awayMeta}</div>
          </div>
          <Flag code={match.awayCode} size={40} />
        </div>
      </div>

      <div className="num mt-2.5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wide text-lo/80">
        <span className="text-up">{match.scorer}</span><span className="text-lo/40">·</span><span>{match.venue}</span>
      </div>
    </div>
  );
}
