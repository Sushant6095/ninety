import { Ticker } from "../home/Ticker";
import { Footer } from "../home/Footer";
import { TerminalHeader } from "./TerminalHeader";
import { CompetitionsRail } from "./CompetitionsRail";
import { AttackMomentum } from "./AttackMomentum";
import { LatestEvents } from "./LatestEvents";
import { MatchColumn } from "./MatchColumn";
import { MarketStatus } from "./MarketStatus";
import { TerminalDock } from "./TerminalDock";
import { PortfolioCard } from "./PortfolioCard";
import { OpenPositions } from "./OpenPositions";
import { GamesRail } from "./GamesRail";
import { TournamentLeaderboard } from "./TournamentLeaderboard";
import { TodaysMovers } from "./TodaysMovers";
import { SESSION } from "../../lib/fixtures";
import { MATCH } from "../../lib/terminal";

/** The Terminal — the pro match-detail trading surface: live competitions + attack momentum + events (left),
 *  the selected market with the big River + trade panel + your position (center), market status + portfolio +
 *  positions + tournament leaderboard + movers (right). Ticks live; wired to fixtures that mirror the API.
 *
 *  `matchId` selects the centre market and defaults to the featured AUS-EGY money-shot, so /terminal is
 *  unchanged. The left-rail attack-momentum + latest-events cards are AUS-EGY-specific fixtures, so they show
 *  only for the featured market — a non-featured match never gets another match's momentum/events under it. */
export function TerminalScreen({ matchId = MATCH.matchId }: { matchId?: string }) {
  const featured = matchId === MATCH.matchId;
  return (
    // pb-20 clears the fixed bottom dock so the footer / trade panel never sit under it at any breakpoint.
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg pb-20">
      <Ticker />
      <TerminalHeader user={SESSION} />
      {/* Anchors the dock's fold-gate: while this top sentinel is (near) in view, TerminalDock hides so it never
          floats over the live prices / River. Zero-height, non-interactive. */}
      <div id="terminal-fold-sentinel" aria-hidden className="h-0" />
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-start gap-3 px-3 py-3 sm:px-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <h1 className="sr-only">Live match terminal</h1>
        <div className="hidden flex-col gap-3 xl:flex">
          <CompetitionsRail />
          {featured && <AttackMomentum />}
          {featured && <LatestEvents />}
        </div>
        <div className="min-w-0">
          <MatchColumn matchId={matchId} />
          {/* Below xl the right rail (which holds the Games section) is display:none, so surface the Games hub
              here in the centre column instead — the terminal stays a games-inclusive surface at every width. */}
          <div className="mt-3 xl:hidden">
            <GamesRail />
          </div>
        </div>
        <div className="hidden flex-col gap-3 xl:flex">
          <MarketStatus matchId={matchId} />
          <PortfolioCard />
          <OpenPositions />
          <GamesRail />
          <TournamentLeaderboard />
          <TodaysMovers />
        </div>
      </main>
      <Footer />
      <TerminalDock featured={featured} />
    </div>
  );
}
