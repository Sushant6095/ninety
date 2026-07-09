import Link from "next/link";
import { routes } from "../../lib/routes";
import { TICKER } from "../../lib/fixtures";

const p1 = (n: number): string => n.toFixed(1);

/** The top live-match ticker — a calm, mono strip. Each item links to its match. */
export function Ticker() {
  return (
    <div className="border-b border-hairline bg-bg">
      <div className="flex items-stretch gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex shrink-0 items-center gap-1.5 border-r border-hairline px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-lo">
          <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_5px_var(--up)]" />
          WC26 LIVE
        </div>
        {TICKER.map((t) => (
          <Link
            key={t.matchId}
            href={routes.match(t.matchId)}
            className="group flex shrink-0 items-center gap-2 border-r border-hairline px-3 py-2 transition-colors duration-200 hover:bg-surface"
          >
            {t.minute != null ? (
              <span className="num text-[11px] font-semibold text-up">{t.minute}&#39;</span>
            ) : (
              <span className="num text-[11px] text-lo">{"—"}</span>
            )}
            <span className="text-[11px] font-medium text-hi/90">{t.code}</span>
            {t.score && <span className="num text-[11px] text-hi">{t.score}</span>}
            <span className="num text-[11px] text-lo">{t.lead}</span>
            <span className="num text-[11px] font-medium text-hi tabular-nums">{p1(t.price)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
