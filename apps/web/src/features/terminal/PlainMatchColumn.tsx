"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { MatchHeader } from "./MatchHeader";
import { DOCK_TRADE_EVENT } from "./TerminalDock";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { PriceCells } from "./PriceCells";
import { TradePanel, type PlaceResult } from "./TradePanel";
import { YourPosition } from "./YourPosition";
import { TradeSheet } from "../../components/ui/TradeSheet";
import { PreMatchPanel, SettledPanel } from "./MatchStates";
import { PlainMatchTabs } from "./PlainMatchTabs";
import { useMatchLive, FULL_TIME } from "../live/matchLiveStore";
import { POSITIONS, PORTFOLIO, type PositionRow, type TerminalMatch } from "../../lib/terminal";
import { marketByMatchId, koClock, teamName } from "../../lib/fixtures";
import { quote as lmsrQuote } from "../../lib/lmsr";
import { fmtCR } from "../../lib/format";
import type { MarketRow, Outcome } from "../../lib/types";

// ── The non-featured match terminal ─────────────────────────────────────────────────────────────────
// Any board market that ISN'T the AUS-EGY money-shot opens here: its OWN header, score, teams, River and
// price cells — all from the fixture identity + the ONE live store, keyed by this matchId. It deliberately
// carries NONE of the featured halt choreography (no useHaltSequence, no Next Goal card, no Ashour cliff) and
// never borrows AUS-EGY data. Density comes from being real, not from replaying another match's story.

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };
const AMM_B = 1200;
const OUTCOMES: Outcome[] = ["H", "D", "A"];
const EMPTY_MARK: Record<Outcome, number> = { H: 0, D: 0, A: 0 };

// LMSR inventory that reproduces the live mark: q = b·ln(p) — the same derivation lib/terminal's MATCH.amm is
// built from, so a client-side quote is priced off exactly the prices the cells show. ponytail: derived from the
// store mark rather than a per-match seeded amm (there is only one seeded amm, the featured market's).
function ammFromPrices(prices: Record<Outcome, number>): { q: number[]; b: number; spreadMult: number } {
  return { q: OUTCOMES.map((o) => Math.round(AMM_B * Math.log(Math.max(0.02, prices[o])))), b: AMM_B, spreadMult: 1 };
}

// The still identity for MatchHeader, from the board fixture. Meta stays honest ("HOME"/"AWAY", no invented FIFA
// rank/venue for non-featured markets); the amm/goal fields exist only to satisfy the type — the live amm above
// is what actually prices a trade.
function toTerminalMatch(m: MarketRow): TerminalMatch {
  return {
    marketId: m.marketId, matchId: m.matchId,
    home: m.home, away: m.away, homeCode: m.homeCode, awayCode: m.awayCode,
    homeMeta: "HOME", awayMeta: "AWAY",
    stage: m.stage, competition: m.competition, venue: "",
    b: AMM_B, tick: 2.2, amm: { q: [], b: AMM_B, spreadMult: 1 }, goalLabel: "",
  };
}

/** A quiet momentum River — the home-win% trace over the 0–90' axis, no halt overlays. Ticks live via the store. */
function PlainRiver({ homeCode, spark, minute }: { homeCode: string; spark: number[]; minute: number }) {
  const rising = spark.length > 1 && spark[spark.length - 1] >= spark[0];
  const nowPct = Math.min(100, Math.max(0, (minute / FULL_TIME) * 100));
  return (
    <div className="border-b border-hairline px-4 py-3">
      <h3 className="mb-1 text-label font-semibold uppercase tracking-label text-lo">
        Momentum River — <span className="text-hi">{homeCode} win %</span>
      </h3>
      <div className="relative">
        <MomentumRiver data={spark} up={rising} height={300} yRange={[0, 100]} totalMinutes={FULL_TIME} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-px bg-hairline" style={{ left: `${nowPct}%` }} />
      </div>
      <div className="num relative mt-1 h-4 text-label text-lo">
        <span className="absolute left-0">0&#39;</span>
        <span className="absolute left-1/2 -translate-x-1/2">HT</span>
        <span className="absolute right-0">90&#39;</span>
        {minute > 8 && minute < 84 && Math.abs(minute - 45) > 5 && (
          <span className="absolute -translate-x-1/2 font-semibold text-hi" style={{ left: `${nowPct}%` }}>{minute}&#39;</span>
        )}
      </div>
    </div>
  );
}

/** Route-facing wrapper: resolve the fixture, then hand a guaranteed market to the inner (so every hook runs
 *  unconditionally). The route already 404s an unknown id — the null here is belt-and-braces. */
export function PlainMatchColumn({ matchId }: { matchId: string }) {
  const market = marketByMatchId(matchId);
  if (!market) return null;
  return <PlainColumnInner matchId={matchId} market={market} />;
}

function PlainColumnInner({ matchId, market }: { matchId: string; market: MarketRow }) {
  const live = useMatchLive(matchId);
  const status = live?.status ?? (market.minute != null ? "LIVE" : "PRE");
  // The store seeds every board market, so `live` is present; the fixture mark is the belt-and-braces seed. Cast
  // the fixture's Record<string,number> to the outcome-keyed shape (mkt() always fills H/D/A).
  const seedMark = (market.mark ?? EMPTY_MARK) as Record<Outcome, number>;
  const mark: Record<Outcome, number> = live?.prices ?? seedMark;
  const open: Record<Outcome, number> = live?.openPrices ?? seedMark;
  const spark = live?.spark ?? market.spark;
  const minute = live?.minute ?? market.minute;
  const score = live?.score ?? market.score ?? null;

  const [selected, setSelected] = useState<Outcome>("H");
  const [positions, setPositions] = useState<PositionRow[]>(() => POSITIONS.filter((p) => p.marketId === matchId));
  const [free, setFree] = useState(PORTFOLIO.free);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The bottom dock's "Open trade ticket" tool lands here (the replay tool is featured-only). No-op on the
  // non-live states, where no trade sheet is mounted.
  useEffect(() => {
    const onTrade = (): void => setSheetOpen(true);
    window.addEventListener(DOCK_TRADE_EVENT, onTrade);
    return () => window.removeEventListener(DOCK_TRADE_EVENT, onTrade);
  }, []);

  const term = useMemo(() => toTerminalMatch(market), [market]);
  const amm = useMemo(() => ammFromPrices(mark), [mark]);
  const todayDelta = useMemo(
    () => ({ H: (mark.H - open.H) * 100, D: (mark.D - open.D) * 100, A: (mark.A - open.A) * 100 }) as Record<Outcome, number>,
    [mark, open],
  );

  const heldShares: Partial<Record<Outcome, number>> = {};
  for (const p of positions) heldShares[p.outcome] = (heldShares[p.outcome] ?? 0) + p.shares;
  const primary = positions.find((p) => p.outcome === selected) ?? positions[0];

  const codeFor = (o: Outcome): string => (o === "H" ? market.homeCode : o === "A" ? market.awayCode : "DRAW");
  const vsFor = (o: Outcome): string => (o === "H" ? market.awayCode : o === "A" ? market.homeCode : `${market.homeCode}/${market.awayCode}`);

  // Server-verified analog (same shape as the featured column): recompute the LMSR quote on submit off the live
  // amm, validate credits / holdings, then apply optimistically; reject paths surface a Sonner toast.
  const placeOrder = useCallback(
    (side: "buy" | "sell", size: number): PlaceResult => {
      if (size <= 0) { const msg = "Pick a size first."; toast.error(msg); return { ok: false, error: msg }; }
      const q = lmsrQuote(amm.q, amm.b, IDX[selected], size, side, amm.spreadMult);
      const code = codeFor(selected);
      if (side === "buy") {
        if (q.cost > free) { const msg = `Not enough credits — needs ${fmtCR(q.cost)}, you have ${fmtCR(free)}.`; toast.error(msg); return { ok: false, error: msg }; }
        setFree((f) => f - q.cost);
        setPositions((prev) => {
          const i = prev.findIndex((p) => p.outcome === selected);
          if (i < 0) return [...prev, { marketId: matchId, code, vs: vsFor(selected), outcome: selected, shares: size, avgEntry: q.avgPx, pnl: null, live: true }];
          const p = prev[i];
          const shares = p.shares + size;
          const avgEntry = (p.shares * p.avgEntry + size * q.avgPx) / shares;
          return prev.map((x, idx) => (idx === i ? { ...x, shares, avgEntry } : x));
        });
        return { ok: true, avgPx: q.avgPx };
      }
      const have = heldShares[selected] ?? 0;
      if (have <= 0) { const msg = `No ${code} position to sell.`; toast.error(msg); return { ok: false, error: msg }; }
      if (size > have) { const msg = `You hold only ${have} ${code}.`; toast.error(msg); return { ok: false, error: msg }; }
      setFree((f) => f + q.cost);
      setPositions((prev) => {
        const i = prev.findIndex((p) => p.outcome === selected);
        const p = prev[i];
        const shares = p.shares - size;
        if (shares <= 0) return prev.filter((_, idx) => idx !== i);
        return prev.map((x, idx) => (idx === i ? { ...x, shares } : x));
      });
      return { ok: true, avgPx: q.avgPx };
    },
    [selected, free, positions, amm, matchId], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const isLive = status === "LIVE" || status === "HALTED";

  // Settled final: derive the winner from the resolved mark (a settled 1X2 reads {1,0,0} / {0,1,0} / {0,0,1}).
  const winner = OUTCOMES.reduce((a, b) => (mark[b] > mark[a] ? b : a), "H" as Outcome);
  const settledResult = {
    winner,
    winnerName: winner === "D" ? "Match drawn" : teamName(winner === "H" ? market.homeCode : market.awayCode),
    scoreLine: score ? `${score.home} – ${score.away}` : "—",
    settleSig: "", // fail-closed (ADR-036/037): no real settle tx → ProofBadge shows honest pending, never a dead link
  };

  return (
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <MatchHeader match={term} live={{ score, minute, phase: live?.phase ?? "", scorer: "", status }} />

      {status === "SETTLED" ? (
        <SettledPanel
          result={settledResult}
          held={primary ? { code: primary.code, outcome: primary.outcome, shares: primary.shares, avgEntry: primary.avgEntry } : undefined}
        />
      ) : isLive ? (
        <>
          <PlainRiver homeCode={market.homeCode} spark={spark} minute={minute ?? 0} />
          <PriceCells
            mark={mark}
            todayDelta={todayDelta}
            codes={{ H: market.homeCode, A: market.awayCode }}
            selected={selected}
            onSelect={setSelected}
            heldShares={heldShares}
          />
          <div className="hidden lg:block">
            <TradePanel amm={amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} />
          </div>
          <div className="border-b border-hairline p-3 lg:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80"
            >
              Trade {codeFor(selected)} @ {(mark[selected] * 100).toFixed(1)}
            </button>
          </div>
          <TradeSheet open={sheetOpen} onOpenChange={setSheetOpen} title={`Trade · ${market.home} v ${market.away}`}>
            <TradePanel amm={amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} />
          </TradeSheet>
          {primary && (
            <YourPosition code={primary.code} shares={primary.shares} avgEntry={primary.avgEntry} markPct={mark[primary.outcome] * 100} opened={primary.pre ? "opened pre-match" : "opened in-play"} />
          )}
        </>
      ) : (
        <>
          <PriceCells
            mark={mark}
            todayDelta={todayDelta}
            codes={{ H: market.homeCode, A: market.awayCode }}
            selected={selected}
            onSelect={setSelected}
            heldShares={heldShares}
            disabled
          />
          <PreMatchPanel kickoff={koClock(market.kickoffAt)} />
        </>
      )}

      <PlainMatchTabs homeCode={market.homeCode} awayCode={market.awayCode} positions={positions} mark={mark} />
    </section>
  );
}
