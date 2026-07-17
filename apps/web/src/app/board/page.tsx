import type { Metadata } from "next";
import { HomeShell } from "../../features/home/HomeShell";
import { BentoBoard } from "../../features/home/BentoBoard";
import { getBoardMarkets } from "../../lib/data/markets";

export const metadata: Metadata = { title: "Ninety — tonight's matches" };

// Live board reads GET /markets at request time (fixtures under NEXT_PUBLIC_USE_FIXTURES=1). force-dynamic so
// `next build` never tries to prerender-fetch the API.
export const dynamic = "force-dynamic";

// The board (moved from / — the landing owns the root now): match board (live/today/finished, grouped),
// then the dashboard bento (movers · standings · rankings · traders · booth news) with quiet rails.
// Live prices/scores flow from the ONE match store (seeded from MARKETS, drifted by the
// MatchLiveProvider in the root layout) — the same store /terminal reads.
export default async function Board() {
  const markets = await getBoardMarkets();
  return (
    <HomeShell markets={markets}>
      <BentoBoard />
    </HomeShell>
  );
}
