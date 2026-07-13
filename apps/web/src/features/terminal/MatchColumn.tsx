"use client";
import { useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { MatchHeader } from "./MatchHeader";
import { BigRiver } from "./BigRiver";
import { PriceCells } from "./PriceCells";
import { TradePanel, type PlaceResult } from "./TradePanel";
import { YourPosition } from "./YourPosition";
import { MatchTabs } from "./MatchTabs";
import { StateSwitcher, PreMatchPanel, SettledPanel, type MatchView } from "./MatchStates";
import { HaltBanner } from "../../components/ui/HaltBanner";
import { TradeSheet } from "../../components/ui/TradeSheet";
import { useTerminalLive } from "./useTerminalLive";
import { useHaltSequence, type HaltActions } from "./useHaltSequence";
import { MATCH, POSITIONS, PORTFOLIO, type PositionRow } from "../../lib/terminal";
import { quote as lmsrQuote } from "../../lib/lmsr";
import { fmtCR } from "../../lib/format";
import type { Outcome } from "../../lib/types";

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };
const codeFor = (o: Outcome): string => (o === "H" ? MATCH.homeCode : o === "A" ? MATCH.awayCode : "DRAW");
const vsFor = (o: Outcome): string => (o === "H" ? MATCH.awayCode : o === "A" ? MATCH.homeCode : `${MATCH.homeCode}/${MATCH.awayCode}`);

// Settled-state result (the settle envelope in production). Egypt take it late; the proof posts to devnet.
const SETTLED_RESULT = { winner: "A" as Outcome, winnerName: "Egypt", scoreLine: "0 – 2", settleSig: "7hNq…devnetAusEgy4kP" };

// ── The halt money-shot — ONE consistent story (the demo's cold open) ─────────────────────────────
// Ashour's counter at 13': pre-goal the away line (Egypt's win%) sits ~31; the goal reprices it to 55, the score
// steps 0–0 → 0–1, and the Booth calls it. The pre-halt River seeds FLAT ~31 so the cold open reads pre-goal.
const AWAY_PRE = 31;
const AWAY_POST = 55;
const BOOTH_DELTA = AWAY_POST - AWAY_PRE; // +24
const BOOTH_QUOTE = "Ashour's counter — Egypt 31 → 55";
const GOAL_MINUTE = 13;
const flatSpark = (base: number): number[] => Array.from({ length: 24 }, (_, i) => Math.round((base + Math.sin(i * 1.1) * 0.9) * 10) / 10);
const HALT_MARK0: Record<Outcome, number> = { H: 0.48, D: 0.21, A: 0.31 }; // 0–0, Australia (home) narrow favourite
const HALT_SPARK_A = flatSpark(31); // Egypt win% — flat pre-goal
const HALT_SPARK_H = flatSpark(48); // Australia context trace

/** Center trading column — owns the live tick, the selected outcome, AND the optimistic trade store: a confirmed
 *  order updates positions + free credits locally and reconciles on the fill frame (here: applied immediately;
 *  the reject path — insufficient credits / oversell — surfaces a Sonner toast). Badges read this one source. */
export function MatchColumn() {
  const { mark, spark, homeSpark, freeze: freezeTicks, repriceCells, settleChart } = useTerminalLive(HALT_MARK0, HALT_SPARK_A, HALT_SPARK_H);
  const [selected, setSelected] = useState<Outcome>("A");
  const [view, setView] = useState<MatchView>("LIVE");
  const [positions, setPositions] = useState<PositionRow[]>(() => POSITIONS.filter((p) => p.marketId === MATCH.matchId));
  const [free, setFree] = useState(PORTFOLIO.free);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replayBusy, setReplayBusy] = useState(false);
  const [awayScore, setAwayScore] = useState(0); // 0–0 pre-goal; steps to 0–1 as Ashour's counter lands on the cliff

  // The Tier-0 halt money-shot — one GSAP timeline scoped to this section, driven off the data-halt hooks its
  // children render. The callbacks only flip the market view + push the split reprice; GSAP owns all the travel.
  const sectionRef = useRef<HTMLElement>(null);
  const haltActions = useMemo<HaltActions>(
    () => ({
      reset: () => { setView("LIVE"); freezeTicks(true); repriceCells(AWAY_PRE); settleChart(AWAY_PRE); setAwayScore(0); },
      halt: () => setView("HALTED"),
      land: () => { repriceCells(AWAY_POST); setAwayScore(1); },
      settle: () => settleChart(AWAY_POST),
      resume: () => { setView("LIVE"); freezeTicks(false); },
      busy: setReplayBusy,
    }),
    [freezeTicks, repriceCells, settleChart],
  );
  const { replay } = useHaltSequence(sectionRef, haltActions);

  // Header override — the money-shot story: minute 13', Ashour's goal, score 0–0 → 0–1, status LIVE/HALTED.
  const headerLive = useMemo(
    () => ({
      score: { home: 0, away: awayScore },
      minute: GOAL_MINUTE,
      phase: "1ST HALF",
      scorer: awayScore > 0 ? "ASHOUR ← HAFEZ 13'" : "",
      status: view === "HALTED" ? "HALTED" : "LIVE",
    }),
    [awayScore, view],
  );

  const heldShares: Partial<Record<Outcome, number>> = {};
  for (const p of positions) heldShares[p.outcome] = (heldShares[p.outcome] ?? 0) + p.shares;
  const heldSel = positions.find((p) => p.outcome === selected);
  const primary = heldSel ?? positions[0];

  // Server-verified analog: recompute the authoritative quote on submit, validate, then apply optimistically.
  const placeOrder = useCallback(
    (side: "buy" | "sell", size: number): PlaceResult => {
      if (size <= 0) { const msg = "Pick a size first."; toast.error(msg); return { ok: false, error: msg }; }
      const q = lmsrQuote(MATCH.amm.q, MATCH.amm.b, IDX[selected], size, side, MATCH.amm.spreadMult);
      const code = codeFor(selected);

      if (side === "buy") {
        if (q.cost > free) {
          const msg = `Not enough credits — needs ${fmtCR(q.cost)}, you have ${fmtCR(free)}.`;
          toast.error(msg);
          return { ok: false, error: msg };
        }
        setFree((f) => f - q.cost);
        setPositions((prev) => {
          const i = prev.findIndex((p) => p.outcome === selected);
          if (i < 0) return [...prev, { marketId: MATCH.matchId, code, vs: vsFor(selected), outcome: selected, shares: size, avgEntry: q.avgPx, pnl: null, live: true }];
          const p = prev[i];
          const shares = p.shares + size;
          const avgEntry = (p.shares * p.avgEntry + size * q.avgPx) / shares;
          return prev.map((x, idx) => (idx === i ? { ...x, shares, avgEntry } : x));
        });
        return { ok: true, avgPx: q.avgPx };
      }

      // sell
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
    [selected, free, positions], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <section ref={sectionRef} className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <MatchHeader match={MATCH} live={headerLive} />
      {/* the halt strip lands directly UNDER THE SCORE — mounts on HALTED, slides itself in (Framer, isolated) */}
      {view === "HALTED" && <HaltBanner reason="Ashour's counter under review — repricing" />}
      <BigRiver
        match={MATCH}
        mark={mark}
        spark={spark}
        homeSpark={homeSpark}
        onReplay={replay}
        replayBusy={replayBusy}
        boothQuote={BOOTH_QUOTE}
        boothDelta={BOOTH_DELTA}
      />

      <StateSwitcher view={view} onChange={setView} />

      {view === "SETTLED" ? (
        <SettledPanel
          result={SETTLED_RESULT}
          held={primary ? { code: primary.code, outcome: primary.outcome, shares: primary.shares, avgEntry: primary.avgEntry } : undefined}
        />
      ) : (
        <>
          {/* the trade area — dims to 0.55 while the market is halted (GSAP drives opacity on this hook) */}
          <div data-halt="dim">
            <PriceCells
              mark={mark}
              todayDelta={MATCH.todayDelta}
              codes={{ H: MATCH.homeCode, A: MATCH.awayCode }}
              selected={selected}
              onSelect={setSelected}
              heldShares={heldShares}
              disabled={view === "PRE"}
              frozen={view === "HALTED"}
            />
            {(view === "LIVE" || view === "HALTED") && (
              <>
                {/* the Buy/Sell panel stays mounted but DISABLES (greyed + inert) during the halt, then re-enables */}
                <div className="hidden lg:block">
                  <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} disabled={view === "HALTED"} />
                </div>
                <div className="border-b border-hairline p-3 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    disabled={view === "HALTED"}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {view === "HALTED" ? "Trading paused" : `Trade ${codeFor(selected)} @ ${(mark[selected] * 100).toFixed(1)}`}
                  </button>
                </div>
                <TradeSheet open={sheetOpen} onOpenChange={setSheetOpen} title={`Trade · ${MATCH.home} v ${MATCH.away}`}>
                  <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} disabled={view === "HALTED"} />
                </TradeSheet>
              </>
            )}
          </div>
          {view === "PRE" && <PreMatchPanel kickoff="02:14:36" />}
          {primary && (view === "LIVE" || view === "HALTED") && (
            <YourPosition code={primary.code} shares={primary.shares} avgEntry={primary.avgEntry} markPct={mark[primary.outcome] * 100} opened={primary.pre ? "opened pre-match" : "opened in-play"} />
          )}
        </>
      )}
      <MatchTabs positions={positions} mark={mark} />
    </section>
  );
}
