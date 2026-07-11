import Link from "next/link";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { Flag } from "../../components/ui/Flag";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { routes } from "../../lib/routes";
import { SESSION } from "../../lib/fixtures";
import { ACCOUNT, OPEN_POSITIONS, marketValue, costBasis, unrealized, type OpenPosition } from "../../lib/portfolio";
import { fmtCR, fmtPrice, signedCR, signedPct } from "../../lib/format";

function Stat({ label, value, tone = "hi" }: { label: string; value: string; tone?: "hi" | "up" | "down" | "lo" }) {
  const color = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "lo" ? "text-lo" : "text-hi";
  return (
    <div>
      <div className="text-label font-medium uppercase tracking-[0.1em] text-lo">{label}</div>
      <div className={`num mt-1 text-strong font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function CrestPair({ home, away }: { home: string; away: string }) {
  return (
    <span className="relative inline-flex shrink-0 items-center" style={{ width: 40, height: 26 }}>
      <span className="absolute left-0"><Flag code={home} size={26} /></span>
      <span className="absolute left-[16px] ring-2 ring-surface rounded-full"><Flag code={away} size={26} /></span>
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
        className="group grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 active:bg-hairline/40"
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
              {p.shares} sh · avg {fmtPrice(p.avgEntry)} → <span className="text-hi/80">{fmtPrice(p.markNow)}</span>
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

export function PortfolioPage() {
  // Reconciles to the cent: equity = free + Σ market value; unrealized = Σ shares·(now − avg).
  const positions = [...OPEN_POSITIONS].sort((a, b) => a.matchId.localeCompare(b.matchId)); // ponytail: same-match rows sit adjacent — degenerate grouping until a match holds >1 position
  const mv = positions.reduce((s, p) => s + marketValue(p), 0);
  const invested = positions.reduce((s, p) => s + costBasis(p), 0);
  const unreal = mv - invested;
  const equity = ACCOUNT.free + mv;
  const dayChange = equity - ACCOUNT.curve[0];
  const dayPct = (dayChange / ACCOUNT.curve[0]) * 100;
  const gain = dayChange >= 0;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader user={SESSION} />
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Portfolio</h1>
          <p className="mt-1 text-body text-lo">Your credits, open positions, and live P&amp;L — play money, World Cup 2026.</p>
        </div>

        {/* HERO — one thing beautifully: equity + the session curve */}
        <section className="elev overflow-hidden rounded-card border border-hairline bg-surface">
          <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5">
            <div>
              <div className="text-label font-medium uppercase tracking-[0.1em] text-lo">Portfolio value</div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="num font-display text-display font-bold tabular-nums text-hi">{fmtCR(equity)}</span>
                <span className="text-caption font-medium text-lo">CR</span>
              </div>
              <div className={`num mt-1 text-strong font-semibold tabular-nums ${gain ? "text-up" : "text-down"}`}>
                {signedCR(dayChange)} <span className="text-caption">({signedPct(dayPct)}) today</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
              <Stat label="Free" value={fmtCR(ACCOUNT.free)} />
              <Stat label="In positions" value={fmtCR(mv)} />
              <Stat label="Unrealized" value={signedCR(unreal)} tone={unreal >= 0 ? "up" : "down"} />
            </div>
          </div>
          <div className="mt-4 px-1">
            <EquityCurve values={ACCOUNT.curve} up={gain} height={120} />
          </div>
        </section>

        {/* OPEN POSITIONS */}
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-strong font-semibold text-hi">Open positions</h2>
            <span className="num text-caption text-lo">{positions.length}</span>
          </div>
          {positions.length === 0 ? (
            <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-14 text-center">
              <p className="text-body text-lo">No open positions yet.</p>
              <Link href={routes.home} className="mt-2 text-body text-up transition-opacity duration-200 hover:opacity-80">Find a live match to trade →</Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-card border border-hairline bg-surface">
              <ul className="divide-y divide-hairline/60">
                {positions.map((p) => (
                  <PositionRow key={p.marketId} p={p} />
                ))}
              </ul>
            </div>
          )}
          <div className="mt-3 text-right">
            <Link href={routes.history} className="text-caption font-medium text-lo transition-colors duration-200 hover:text-hi">
              Full trade history →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
