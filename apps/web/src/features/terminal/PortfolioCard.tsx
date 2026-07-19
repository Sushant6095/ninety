"use client";
import { useSession } from "../session/SessionProvider";

/** Right-rail account summary: equity + free credits, from the REAL per-session identity (never a hardcoded
 *  fixture). A fresh account reads 1,000 equity / 1,000 free with a flat baseline — no fabricated 7-day history,
 *  so it can never contradict the header's "1,000 CR · Unranked". Equity = free credits + open-position value. */
export function PortfolioCard() {
  const session = useSession();
  const openValue = session.positions.reduce((sum, p) => sum + p.shares * p.markNow, 0);
  const equity = session.credits + openValue;
  const free = session.credits;

  return (
    <section className="elev rounded-card border border-hairline/70 bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h2 className="text-label font-semibold uppercase tracking-label text-lo">Portfolio</h2>
        <span className="text-label font-medium uppercase tracking-label text-lo">Play money</span>
      </div>
      <div className="px-4 pb-3">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="num text-display font-bold tabular-nums leading-none text-hi">
              {equity.toLocaleString("en-US")}
            </span>
            <span className="text-label text-lo">equity cr</span>
          </div>
          <span className="num text-label tabular-nums text-lo">{free.toLocaleString("en-US")} free</span>
        </div>
        <div className="mt-3 flex h-12 items-center" aria-hidden>
          <span className="h-px w-full rounded-full bg-hairline" />
        </div>
        <p className="text-label text-lo">
          {session.hasActivity ? "Session equity" : "Trade a market to start your curve"}
        </p>
      </div>
    </section>
  );
}
