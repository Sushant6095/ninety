"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { MatchHeader } from "./MatchHeader";
import { BigRiver } from "./BigRiver";
import { PriceCells } from "./PriceCells";
import { TradePanel, type PlaceResult } from "./TradePanel";
import { YourPosition } from "./YourPosition";
import { MatchTabs } from "./MatchTabs";
import { StateSwitcher, PreMatchPanel, HaltCallout, SettledPanel, type MatchView } from "./MatchStates";
import { HaltBanner } from "../../components/ui/HaltBanner";
import { TradeSheet } from "../../components/ui/TradeSheet";
import { useMatchLive, setMatchStatus, TERMINAL_MATCH_ID } from "../live/matchLiveStore";
import { MATCH, POSITIONS, PORTFOLIO, type PositionRow } from "../../lib/terminal";
import { quote as lmsrQuote } from "../../lib/lmsr";
import { fmtCR } from "../../lib/format";
import type { Outcome } from "../../lib/types";

const IDX: Record<Outcome, number> = { H: 0, D: 1, A: 2 };
const codeFor = (o: Outcome): string => (o === "H" ? MATCH.homeCode : o === "A" ? MATCH.awayCode : "DRAW");
const vsFor = (o: Outcome): string => (o === "H" ? MATCH.awayCode : o === "A" ? MATCH.homeCode : `${MATCH.homeCode}/${MATCH.awayCode}`);

// Settled-state result (the settle envelope in production). Egypt take it late; the proof posts to devnet.
const SETTLED_RESULT = { winner: "A" as Outcome, winnerName: "Egypt", scoreLine: "0 – 2", settleSig: "7hNq…devnetAusEgy4kP" };
const HALT_REASON = "Egypt think they've doubled the lead — the goal is under VAR review, so trading is paused. Prices resume the instant the call comes.";

/** Center trading column — owns the live tick, the selected outcome, AND the optimistic trade store: a confirmed
 *  order updates positions + free credits locally and reconciles on the fill frame (here: applied immediately;
 *  the reject path — insufficient credits / oversell — surfaces a Sonner toast). Badges read this one source. */
export function MatchColumn() {
  // Status · score · minute · prices all flow from the ONE store — never local state or fixtures.
  const live = useMatchLive(TERMINAL_MATCH_ID);
  const mark = live?.prices ?? { H: 0, D: 0, A: 0 };
  const spark = live?.spark ?? [];
  const homeSpark = live?.homeSpark ?? [];
  const view: MatchView = live?.status ?? "LIVE";
  const [selected, setSelected] = useState<Outcome>("A");
  const [positions, setPositions] = useState<PositionRow[]>(() => POSITIONS.filter((p) => p.marketId === MATCH.matchId));
  const [free, setFree] = useState(PORTFOLIO.free);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <MatchHeader match={MATCH} />
      <BigRiver match={MATCH} mark={mark} spark={spark} homeSpark={homeSpark} />

      {view === "HALTED" && <HaltBanner reason="Goal under VAR review — prices frozen" />}
      <StateSwitcher view={view} onChange={(v) => setMatchStatus(TERMINAL_MATCH_ID, v)} />

      {view === "SETTLED" ? (
        <SettledPanel
          result={SETTLED_RESULT}
          held={primary ? { code: primary.code, outcome: primary.outcome, shares: primary.shares, avgEntry: primary.avgEntry } : undefined}
        />
      ) : (
        <>
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
          {view === "LIVE" && (
            <>
              <div className="hidden lg:block">
                <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} />
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
              <TradeSheet open={sheetOpen} onOpenChange={setSheetOpen} title={`Trade · ${MATCH.home} v ${MATCH.away}`}>
                <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} markPx={mark[selected] * 100} free={free} heldShares={heldShares[selected] ?? 0} onPlace={placeOrder} />
              </TradeSheet>
            </>
          )}
          {view === "PRE" && <PreMatchPanel kickoff="02:14:36" />}
          {view === "HALTED" && <HaltCallout reason={HALT_REASON} />}
          {primary && (view === "LIVE" || view === "HALTED") && (
            <YourPosition code={primary.code} shares={primary.shares} avgEntry={primary.avgEntry} markPct={mark[primary.outcome] * 100} opened={primary.pre ? "opened pre-match" : "opened in-play"} />
          )}
        </>
      )}
      <MatchTabs positions={positions} mark={mark} />
    </section>
  );
}
