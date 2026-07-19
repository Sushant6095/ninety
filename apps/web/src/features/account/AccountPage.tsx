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
import { useSession } from "../session/SessionProvider";
import { routes } from "../../lib/routes";
import { MARKETS } from "../../lib/fixtures";
import { ACCOUNT, FILLS, marketValue, costBasis, unrealized, type OpenPosition } from "../../lib/portfolio";
import { momentsByOwner } from "../../lib/moments";
import { PROOFS, PROOFS_TOTAL } from "../../lib/proofs";
import { fmtCR, signedCR, signedPct } from "../../lib/format";

const RAIL: RailItem[] = [
  { label: "Overview", href: "#overview", icon: LayoutGrid },
  { label: "Positions", href: "#positions", icon: Layers },
  { label: "Accuracy", href: "#accuracy", icon: Target },
  { label: "Moments", href: "#moments", icon: Sparkles },
  { label: "Proofs", href: "#proofs", icon: ShieldCheck },
  { label: "Watchlist", href: "#watchlist", icon: Star },
];

/** Rail footer · identity only. The wallet never holds value here; it signs and it proves. */
function RailIdentity({ handle }: { handle: string }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-3">
      <Link
        href={routes.profile(handle)}
        className="group flex min-h-11 items-center gap-2.5 rounded-chip px-1 py-1 outline-none transition-colors duration-200 hover:bg-hairline/25 focus-visible:bg-hairline/25 active:scale-[0.97]"
      >
        <Avatar handle={handle} size={28} />
        <span className="min-w-0">
          <span className="block truncate text-strong font-medium text-hi">{handle}</span>
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
  const session = useSession();
  // Positions come from the per-user session — a fresh trader has none. Live merge, same as the board (ADR-051):
  // still parts from the session, moving parts from the ONE store.
  const liveById = new Map(useMatchLiveList().map((s) => [s.matchId, s]));
  const positions = session.positions.map((p): OpenPosition => {
    const live = liveById.get(p.matchId);
    if (p.status !== "LIVE" || !live || live.minute == null) return p;
    return { ...p, minute: live.minute, markNow: Math.round(live.prices[p.outcome] * 1000) / 10 };
  });

  // Reconciles to the cent: equity = credits + Σ market value; unrealized = value − cost.
  const mv = positions.reduce((s, p) => s + marketValue(p), 0);
  const invested = positions.reduce((s, p) => s + costBasis(p), 0);
  const unreal = mv - invested;
  const unrealDisplay = positions.reduce((s, p) => s + Math.round(unrealized(p)), 0);
  const equity = session.credits + mv;
  // No activity → no equity history: a flat line at today's credits, 0% day change. Honest, not a fabricated
  // climb. With activity, rescale the seed curve's SHAPE to start at the day-open and END exactly at live equity.
  const seedOpen = ACCOUNT.curve[0];
  const seedSpan = ACCOUNT.curve[ACCOUNT.curve.length - 1] - seedOpen;
  const curve =
    !session.hasActivity || seedSpan === 0
      ? ACCOUNT.curve.map(() => equity)
      : ACCOUNT.curve.map((p) => seedOpen + ((p - seedOpen) * (equity - seedOpen)) / seedSpan);
  const open = curve[0];
  const dayChange = equity - open;
  const dayPct = open ? (dayChange / open) * 100 : 0;
  const gain = dayChange >= 0;

  // Rank percentile against the cup's trader pool — only when the session actually has a rank. A fresh trader is
  // unranked and shows so honestly, never a fabricated #142.
  const traders = Math.max(...PROOFS.map((p) => p.traders));
  const topPct = session.rank == null ? null : Math.max(1, Math.ceil((session.rank / traders) * 100));

  const railItems = RAIL.map((it) => (it.label === "Positions" ? { ...it, count: positions.length } : it));
  const moments = momentsByOwner(session.handle);
  const settledCount = session.hasActivity ? FILLS.filter((f) => f.status === "SETTLED").length : 0;
  const watchCount = MARKETS.filter((m) => m.favourite).length;

  return (
    <AppShell>
      <main className="flex flex-1 flex-col">
        <DashboardShell rail={<DashboardRail items={railItems} footer={<RailIdentity handle={session.handle} />} />}>
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
                value={<>{fmtCR(session.credits)} <span className="text-caption font-normal text-lo">CR</span></>}
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
                value={session.rank == null ? <span className="text-lo">Unranked</span> : <>#{fmtCR(session.rank)}</>}
                detail={
                  session.rank == null ? (
                    <span className="text-lo">Trade a settled market to join the board</span>
                  ) : (
                    <span className="num tabular-nums">Top {topPct}% of {fmtCR(traders)} traders</span>
                  )
                }
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
              <AccuracyBody handle={session.handle} active={session.hasActivity} />
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
              <ProofHistoryList fills={session.hasActivity ? FILLS : []} />
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
