"use client";
// /account · the verifiable forecasting track record. Being RIGHT is the product: credits, open positions,
// accuracy, owned moments, rank, and the on-chain receipts, in one place. Structure is the re-skinned
// watermelon web3-dashboard shell (rail · topbar · stat grid · panels); every gut is Ninety's own.
// /portfolio redirects here · this page absorbs its equity/positions idiom.
import Link from "next/link";
import { Activity, Coins, LayoutGrid, Layers, ShieldCheck, Sparkles, Star, Target, TrendingUp, Trophy } from "lucide-react";
import { DashboardRail, DashboardShell, DashboardTopbar, Panel, StatCard, StatGrid, type RailItem } from "../../components/vendor/watermelon/dashboard-shell";
import { AppShell } from "../../components/ui/AppShell";
import { Avatar } from "../../components/ui/Avatar";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { MomentCard } from "../../components/ui/MomentCard";
import { ProofBadge } from "../../components/ui/ProofBadge";
import { Reveal } from "../../components/ui/Reveal";
import { useMatchLiveList } from "../live/matchLiveStore";
import { AccuracyBody } from "./AccuracyPanel";
import { PositionsList } from "./PositionsPanel";
import { ProofHistoryList } from "./ProofsPanel";
import { WatchlistBody } from "./WatchlistPanel";
import { routes } from "../../lib/routes";
import { SESSION, MARKETS } from "../../lib/fixtures";
import { ACCOUNT, OPEN_POSITIONS, FILLS, marketValue, costBasis, unrealized, type OpenPosition } from "../../lib/portfolio";
import { momentsByOwner } from "../../lib/moments";
import { PROOFS, PROOFS_TOTAL } from "../../lib/proofs";
import { fmtCR, signedCR, signedPct } from "../../lib/format";

const RAIL: RailItem[] = [
  { label: "Overview", href: "#overview", icon: LayoutGrid },
  { label: "Positions", href: "#positions", icon: Layers, count: OPEN_POSITIONS.length },
  { label: "Accuracy", href: "#accuracy", icon: Target },
  { label: "Moments", href: "#moments", icon: Sparkles },
  { label: "Proofs", href: "#proofs", icon: ShieldCheck },
  { label: "Watchlist", href: "#watchlist", icon: Star },
];

/** Rail footer · identity only. The wallet never holds value here; it signs and it proves. */
function RailIdentity() {
  return (
    <div className="rounded-card border border-hairline bg-surface p-3">
      <Link
        href={routes.profile(SESSION.handle)}
        className="group flex min-h-11 items-center gap-2.5 rounded-chip px-1 py-1 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 active:scale-[0.97]"
      >
        <Avatar handle={SESSION.handle} size={28} />
        <span className="min-w-0">
          <span className="block truncate text-strong font-medium text-hi">{SESSION.handle}</span>
          <span className="block text-label text-lo transition-colors duration-200 group-hover:text-hi">Public profile →</span>
        </span>
      </Link>
      <p className="mt-2 border-t border-hairline pt-2 text-label leading-relaxed text-lo">
        Play money. Credits have no cash value.
      </p>
    </div>
  );
}

export function AccountPage() {
  // Live merge, same as the board (ADR-051): still parts from the seed, moving parts from the ONE store.
  const liveById = new Map(useMatchLiveList().map((s) => [s.matchId, s]));
  const positions = OPEN_POSITIONS.map((p): OpenPosition => {
    const live = liveById.get(p.matchId);
    if (p.status !== "LIVE" || !live || live.minute == null) return p;
    return { ...p, minute: live.minute, markNow: Math.round(live.prices[p.outcome] * 1000) / 10 };
  });

  // Reconciles to the cent: equity = free + Σ market value; unrealized = value − cost.
  const mv = positions.reduce((s, p) => s + marketValue(p), 0);
  const invested = positions.reduce((s, p) => s + costBasis(p), 0);
  const unreal = mv - invested;
  // Display sum = Σ of the per-row ROUNDED values, so the card always equals what the rows show
  // (round-then-sum vs sum-then-round drifted by 1 CR · a read-out-loud bug on a numbers product).
  const unrealDisplay = positions.reduce((s, p) => s + Math.round(unrealized(p)), 0);
  const equity = ACCOUNT.free + mv;
  // Rescale the seed curve's SHAPE so it starts at the day-open and ENDS exactly at the live equity. Just
  // appending `equity` to a seed that ended ~1.9k CR higher drew a false vertical cliff at the right edge
  // (a rising shape crashing under a −1.4% label). Because live marks drift, any fixed endpoint mismatches;
  // remapping [open..seedEnd] → [open..equity] keeps the texture, lands on the real value, and matches the
  // day-change sign. Guard the degenerate flat-seed case.
  const open = ACCOUNT.curve[0];
  const seedSpan = ACCOUNT.curve[ACCOUNT.curve.length - 1] - open;
  const curve = seedSpan === 0 ? ACCOUNT.curve.map(() => equity) : ACCOUNT.curve.map((p) => open + ((p - open) * (equity - open)) / seedSpan);
  const dayChange = equity - open;
  const dayPct = (dayChange / open) * 100;
  const gain = dayChange >= 0;

  // Rank percentile against the cup's trader pool (largest settled market's participation).
  const traders = Math.max(...PROOFS.map((p) => p.traders));
  const topPct = Math.max(1, Math.ceil((SESSION.rank / traders) * 100));

  const moments = momentsByOwner(SESSION.handle);
  const settledCount = FILLS.filter((f) => f.status === "SETTLED").length;
  const watchCount = MARKETS.filter((m) => m.favourite).length;

  return (
    <AppShell>
      <main className="flex flex-1 flex-col">
        <DashboardShell rail={<DashboardRail items={RAIL} footer={<RailIdentity />} />}>
          <DashboardTopbar
            title="Account"
            sub="Your forecasting record · every call priced live, every settlement proven on-chain."
            actions={
              <Link
                href={routes.matches}
                className="inline-flex min-h-11 items-center rounded-chip bg-up/10 px-4 text-strong font-semibold text-up outline-none ring-1 ring-inset ring-up/40 transition-colors duration-200 hover:bg-up/15 focus-visible:bg-up/15 active:scale-[0.97]"
              >
                Trade the board
              </Link>
            }
          />

          <section id="overview" aria-label="Overview" className="scroll-mt-20">
            <StatGrid>
              <StatCard
                icon={Coins}
                label="Credits"
                value={<>{fmtCR(ACCOUNT.free)} <span className="text-caption font-normal text-lo">CR</span></>}
                detail={<>1,000 granted per match · <span className="text-hi/80">no cash value</span></>}
              />
              <StatCard
                icon={Activity}
                label="Portfolio value"
                value={<>{fmtCR(equity)} <span className="text-caption font-normal text-lo">CR</span></>}
                chart={<EquityCurve values={curve} up={gain} height={28} quiet />}
              />
              <StatCard
                icon={TrendingUp}
                label="Unrealized"
                value={<span className={unrealDisplay >= 0 ? "text-up" : "text-down"}>{signedCR(unrealDisplay)}</span>}
                detail={<span className="num tabular-nums">{signedPct(invested ? (unreal / invested) * 100 : 0)} on {fmtCR(invested)} CR in play</span>}
              />
              <StatCard
                icon={Trophy}
                label="Rank"
                value={<>#{fmtCR(SESSION.rank)}</>}
                detail={<span className="num tabular-nums">Top {topPct}% of {fmtCR(traders)} traders · <span className={SESSION.rankDelta >= 0 ? "text-up" : "text-down"}>{signedCR(SESSION.rankDelta)} today</span></span>}
              />
            </StatGrid>
          </section>

          <section className="grid gap-4 xl:grid-cols-4">
            <Panel title="Session equity" className="xl:col-span-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pt-4">
                <span className="num font-display text-display font-bold tabular-nums text-hi">{fmtCR(equity)}</span>
                <span className="text-caption font-medium text-lo">CR</span>
                <span className={`num text-strong font-semibold tabular-nums ${gain ? "text-up" : "text-down"}`}>
                  {signedCR(dayChange)} <span className="text-caption font-normal">({signedPct(dayPct)}) today</span>
                </span>
              </div>
              <div className="mt-3 px-1 pb-1">
                <EquityCurve values={curve} up={gain} height={140} />
              </div>
            </Panel>
            <Panel id="accuracy" title="Forecast accuracy">
              <AccuracyBody handle={SESSION.handle} />
            </Panel>
          </section>

          <Panel id="positions" title="Open positions" count={positions.length} action={{ label: "Trade history", href: routes.history }}>
            <PositionsList positions={positions} />
          </Panel>

          <Reveal className="grid gap-4 xl:grid-cols-2">
            <Panel id="moments" title="Moments owned" count={moments.length} action={{ label: "Gallery", href: routes.moments }}>
              {moments.length === 0 ? (
                <div className="grid place-items-center px-4 py-14 text-center">
                  <p className="text-body text-lo">No moments yet · capture a swing while a match is live.</p>
                  <Link
                    href={routes.moments}
                    className="mt-2 rounded-chip px-2 py-1 text-body text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-1 focus-visible:ring-up/40 active:scale-[0.97]"
                  >
                    See today&apos;s swings →
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                  {moments.map((m) => (
                    <div key={m.id} className="grid content-start gap-2">
                      <MomentCard m={m} />
                      {/* the mint receipt · MomentCard is one big Link, so the Solscan anchor lives beside it */}
                      {m.mintSig && <ProofBadge sig={m.mintSig} label="Minted" className="justify-self-start" />}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            <Panel id="proofs" title="Proof history" count={settledCount} action={{ label: `All ${PROOFS_TOTAL} proofs`, href: routes.proofs }}>
              <ProofHistoryList />
            </Panel>
          </Reveal>

          <Reveal>
            <Panel id="watchlist" title="Watchlist" count={watchCount} action={{ label: "Board", href: routes.matches }}>
              <WatchlistBody />
            </Panel>
          </Reveal>

          <p className="pb-2 text-center text-label text-lo">
            Ninety runs on play-money credits · no deposits, no cash value. The wallet is identity and proof only.
          </p>
        </DashboardShell>
      </main>
    </AppShell>
  );
}
