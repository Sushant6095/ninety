import { HomeShell } from "../features/home/HomeShell";
import { MatchList } from "../features/home/MatchList";
import { LiveMarketsProvider } from "../features/home/LiveMarkets";
import { MARKETS } from "../lib/fixtures";

// Home. Center hero = the grouped match list (chunks 2+4). The LiveMarketsProvider ticks the in-play markets so
// prices flash and the River flows; the center list and the right-rail Featured hero share one live source.
// Fixture-seeded; chunk 5 swaps MARKETS for GET /markets + the WS bus feed.
export default function Home() {
  return (
    <LiveMarketsProvider initial={MARKETS}>
      <HomeShell>
        <MatchList markets={MARKETS} />
      </HomeShell>
    </LiveMarketsProvider>
  );
}
