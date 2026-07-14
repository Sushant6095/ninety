import type { ReactNode } from "react";
import { Ticker } from "./Ticker";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { LeftRail } from "./LeftRail";
import { RightRail } from "./RightRail";
import { CenterColumn } from "./CenterColumn";
import { MobileFeatured } from "./MobileFeatured";
import { Footer } from "./Footer";
import { SESSION } from "../../lib/fixtures";
import type { MarketRow } from "../../lib/types";

interface HomeShellProps {
  markets: MarketRow[]; // the live-exchange slate — feeds the center board + the mobile Featured River
  children?: ReactNode; // modules below the board (movers / traders / news)
}

/** The Home page frame: ticker · header · 3-column body (rails quiet, center hero) · footer. */
export function HomeShell({ markets, children }: HomeShellProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <Ticker />
      <TerminalHeader user={SESSION} />
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-start gap-3 px-4 py-3 sm:px-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <h1 className="sr-only">Ninety — live World Cup 2026 exchange</h1>
        {/* Both rails PIN. Their content is ~1000px and the centre column scrolls to ~2200, so unpinned they died
            at 46% of the page and left a third of the board as two empty gutters. Sticky keeps the Featured
            money-shot and the settlement panel in view for the whole scroll. */}
        <div className="hidden xl:block xl:sticky xl:top-3">
          <LeftRail />
        </div>
        <div className="min-w-0">
          {markets[0] && <MobileFeatured market={markets[0]} />}
          <CenterColumn markets={markets}>{children}</CenterColumn>
        </div>
        <div className="hidden xl:block xl:sticky xl:top-3">
          <RightRail />
        </div>
      </main>
      <Footer />
    </div>
  );
}
