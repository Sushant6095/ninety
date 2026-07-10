"use client";
import { useState } from "react";
import { MatchHeader } from "./MatchHeader";
import { BigRiver } from "./BigRiver";
import { PriceCells } from "./PriceCells";
import { TradePanel } from "./TradePanel";
import { YourPosition } from "./YourPosition";
import { BoothTimeline } from "./BoothTimeline";
import { useTerminalLive } from "./useTerminalLive";
import { MATCH, POSITIONS } from "../../lib/terminal";
import type { Outcome } from "../../lib/types";

const codeFor = (o: Outcome): string => (o === "H" ? MATCH.homeCode : o === "A" ? MATCH.awayCode : "DRAW");

/** Center trading column — owns the live tick + the selected outcome, feeds the River, cells, trade panel and P&L. */
export function MatchColumn() {
  const { mark, spark } = useTerminalLive(MATCH.mark, MATCH.spark);
  const [selected, setSelected] = useState<Outcome>("A");
  const held = POSITIONS.find((p) => p.marketId === MATCH.matchId);

  return (
    <section className="elev overflow-hidden rounded-card border border-hairline/70 bg-surface">
      <MatchHeader match={MATCH} />
      <BigRiver match={MATCH} mark={mark} spark={spark} />
      <PriceCells
        mark={mark}
        todayDelta={MATCH.todayDelta}
        codes={{ H: MATCH.homeCode, A: MATCH.awayCode }}
        selected={selected}
        onSelect={setSelected}
        heldOutcome={held?.outcome}
        heldShares={held?.shares}
      />
      <TradePanel amm={MATCH.amm} selected={selected} code={codeFor(selected)} />
      {held && <YourPosition code={held.code} shares={held.shares} avgEntry={held.avgEntry} markPct={mark[held.outcome] * 100} opened="opened pre-match @ 22'" />}
      <BoothTimeline />
    </section>
  );
}
