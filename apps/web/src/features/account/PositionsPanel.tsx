"use client";
// Open positions · the /portfolio idiom absorbed into /account: entry vs live mark per match, unrealized in
// credits. Identity from the seed; minute/mark from the ONE live store (ADR-051) so a row never disagrees
// with /terminal or the board.
import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { routes } from "../../lib/routes";
import { marketValue, unrealized, type OpenPosition } from "../../lib/portfolio";
import { fmtCR, fmtPrice, signedCR } from "../../lib/format";

function CrestPair({ home, away }: { home: string; away: string }) {
  return (
    <span className="relative inline-flex shrink-0 items-center" style={{ width: 40, height: 26 }}>
      <span className="absolute left-0"><TeamCrest code={home} size={26} /></span>
      <span className="absolute left-4 rounded-full ring-2 ring-surface"><TeamCrest code={away} size={26} /></span>
    </span>
  );
}

function PositionRow({ p }: { p: OpenPosition }) {
  const u = unrealized(p);
  const gain = u >= 0;
  return (
    <li>
      <Link
        href={routes.match(p.matchId)}
        aria-label={`${p.pick} position, ${p.shares} shares, ${gain ? "up" : "down"} ${fmtCR(Math.abs(u))} credits`}
        className="group grid min-h-11 grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 active:bg-hairline/40"
      >
        <span className="flex min-w-0 items-center gap-3">
          <CrestPair home={p.homeCode} away={p.awayCode} />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-strong font-medium text-hi">{p.homeCode} v {p.awayCode}</span>
              <span className="shrink-0 rounded-chip bg-bg px-2 py-0.5 text-label font-semibold tracking-wide text-hi ring-1 ring-inset ring-hairline">{p.pick}</span>
              {p.status === "LIVE" ? (
                <span className="num shrink-0 text-label font-semibold text-up">{p.minute}&#39;</span>
              ) : (
                <span className="shrink-0 text-label font-medium uppercase tracking-wide text-lo">upcoming</span>
              )}
            </span>
            <span className="num mt-1 block text-caption tabular-nums text-lo">
              {p.shares} sh · entry {fmtPrice(p.avgEntry)} → <span className="text-hi/80">{fmtPrice(p.markNow)}</span>
            </span>
          </span>
        </span>
        <span className="text-right">
          <span className="num block text-strong font-semibold tabular-nums text-hi">{fmtCR(marketValue(p))}</span>
          <span className={`num mt-1 block text-caption font-medium tabular-nums ${gain ? "text-up" : "text-down"}`}>{signedCR(u)}</span>
        </span>
      </Link>
    </li>
  );
}

export function PositionsList({ positions }: { positions: OpenPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="grid place-items-center px-4 py-14 text-center">
        <p className="text-body text-lo">No open positions yet.</p>
        <Link
          href={routes.matches}
          className="mt-2 rounded-chip px-2 py-1 text-body text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-1 focus-visible:ring-up/40 active:scale-[0.97]"
        >
          Find a live match to trade →
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-hairline/60">
      {positions.map((p) => (
        <PositionRow key={p.marketId} p={p} />
      ))}
    </ul>
  );
}
