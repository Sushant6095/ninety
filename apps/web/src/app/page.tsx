import { HomeShell } from "../features/home/HomeShell";
import { MatchList } from "../features/home/MatchList";
import { TopMovers } from "../features/home/TopMovers";
import { TradersWeek } from "../features/home/TradersWeek";
import { NewsStrip } from "../features/home/NewsStrip";
import { Reveal } from "../components/ui/Reveal";
import { LiveMarketsProvider } from "../features/home/LiveMarkets";
import { MARKETS } from "../lib/fixtures";

// Home. Center hero = a full live-exchange feed (match list → biggest movers → traders of the week → booth
// news). The LiveMarketsProvider ticks in-play markets so prices flash + the River flows across the whole
// board. Fixture-seeded; chunk 5 swaps MARKETS for GET /markets + the WS bus feed.
export default function Home() {
  return (
    <LiveMarketsProvider initial={MARKETS}>
      <HomeShell>
        <MatchList markets={MARKETS} />
        <Reveal><TopMovers /></Reveal>
        <Reveal><TradersWeek /></Reveal>
        <Reveal><NewsStrip /></Reveal>
      </HomeShell>
    </LiveMarketsProvider>
  );
}
