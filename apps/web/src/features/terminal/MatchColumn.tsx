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
import { useHaltSequence, type HaltActions } from "./useHaltSequence";
import {
  useMatchLive, setMatchStatus, setScore, repriceMatch, settleSpark, rewindTerminal,
  TERMINAL_MATCH_ID, MONEY_SHOT,
} from "../live/matchLiveStore";
import { MATCH, POSITIONS, PORTFOLIO, GOAL_MINUTE, type PositionRow } from "../../lib/terminal";
import { quote as lmsrQuote } from "../../lib/lmsr";
import { fmtCR } from "../../lib/format";
import type { Outcome } from "../../lib/types";

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };
const codeFor = (o: Outcome): string => (o === "H" ? MATCH.homeCode : o === "A" ? MATCH.awayCode : "DRAW");
const vsFor = (o: Outcome): string => (o === "H" ? MATCH.awayCode : o === "A" ? MATCH.homeCode : `${MATCH.homeCode}/${MATCH.awayCode}`);

// Settled-state result (the settle envelope in production). Egypt take it late; the proof posts to devnet.
const SETTLED_RESULT = { winner: "A" as Outcome, winnerName: "Egypt", scoreLine: "0 – 2", settleSig: "7hNq…devnetAusEgy4kP" };

// ── The halt money-shot — ONE consistent story, ONE clock (ADR-055) ───────────────────────────────
// Australia v Egypt is goalless at 74' and Egypt's win% has been flat ~31 all match. Ashour's counter lands AT
// the live minute: the market halts, reprices 31 → 55, the score steps 0–0 → 0–1, and the Booth calls it. The
// choreography writes ONLY to the store, so the header, River, rails, Booth and the / board all step together.
const { awayPre: AWAY_PRE, awayPost: AWAY_POST } = MONEY_SHOT;
const BOOTH_DELTA = AWAY_POST - AWAY_PRE; // +24
const BOOTH_QUOTE = `Ashour's counter — Egypt ${AWAY_PRE} → ${AWAY_POST}`;

/** Center trading column — owns the selected outcome AND the optimistic trade store: a confirmed order updates
 *  positions + free credits locally and reconciles on the fill frame (here: applied immediately; the reject path
 *  — insufficient credits / oversell — surfaces a Sonner toast). Every live number reads from the ONE store. */
export function MatchColumn() {
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const view: MatchView = live?.status ?? "LIVE";
  const mark = live?.prices ?? MONEY_SHOT.prices;
  const spark = live?.spark ?? [];
  const homeSpark = live?.homeSpark ?? [];
  const minute = live?.minute ?? MONEY_SHOT.minute;
  const score = live?.score ?? { home: 0, away: 0 };

  const [selected, setSelected] = useState<Outcome>("A");
  const [positions, setPositions] = useState<PositionRow[]>(() => POSITIONS.filter((p) => p.marketId === MATCH.matchId));
  const [free, setFree] = useState(PORTFOLIO.free);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replayBusy, setReplayBusy] = useState(false);

  // Δ vs open — derived from the store, never seeded, so the cells can't claim a move the price didn't make.
  const open = live?.openPrices ?? MONEY_SHOT.prices;
  const todayDelta = useMemo(
    () => ({ H: (mark.H - open.H) * 100, D: (mark.D - open.D) * 100, A: (mark.A - open.A) * 100 }) as Record<Outcome, number>,
    [mark, open],
  );

  // The Tier-0 halt money-shot — one GSAP timeline scoped to this section, driven off the data-halt hooks its
  // children render. The callbacks only write to the store; GSAP owns all the travel.
  const sectionRef = useRef<HTMLElement>(null);
  const haltActions = useMemo<HaltActions>(
    () => ({
      reset: rewindTerminal, // back to the known opening frame: 74', 0–0, Egypt flat at 31
      halt: () => setMatchStatus(TERMINAL_MATCH_ID, "HALTED"), // freezes the clock, the River and the prices
      land: () => { repriceMatch(TERMINAL_MATCH_ID, "A", AWAY_POST); setScore(TERMINAL_MATCH_ID, { home: 0, away: 1 }); },
      settle: () => settleSpark(TERMINAL_MATCH_ID), // the canvas catches up after the SVG cliff has drawn on
      resume: () => setMatchStatus(TERMINAL_MATCH_ID, "LIVE"),
      busy: setReplayBusy,
    }),
    [],
  );
  const { replay } = useHaltSequence(sectionRef, haltActions);

  // The header restates the store — the scorer line appears only once the score actually says a goal exists.
  const headerLive = useMemo(
    () => ({
      score,
      minute,
      phase: live?.phase ?? MONEY_SHOT.phase,
      scorer: score.away > 0 ? `ASHOUR ← HAFEZ ${GOAL_MINUTE}'` : "",
      status: view,
    }),
    [score, minute, live?.phase, view],
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
        minute={minute}
        onReplay={replay}
        replayBusy={replayBusy}
        boothQuote={BOOTH_QUOTE}
        boothDelta={BOOTH_DELTA}
      />

      <StateSwitcher view={view} onChange={(v) => setMatchStatus(TERMINAL_MATCH_ID, v)} />

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
              todayDelta={todayDelta}
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
