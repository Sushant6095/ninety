import type { Metadata } from "next";
import { HomeShell } from "../../features/home/HomeShell";
import { BentoBoard } from "../../features/home/BentoBoard";
import { MARKETS } from "../../lib/fixtures";

export const metadata: Metadata = { title: "Ninety — tonight's matches" };

// The board (moved from / — the landing owns the root now): match board (live/today/finished, grouped),
// then the dashboard bento (movers · standings · rankings · traders · booth news) with quiet rails.
// Live prices/scores flow from the ONE match store (seeded from MARKETS, drifted by the
// MatchLiveProvider in the root layout) — the same store /terminal reads.
export default function Board() {
  return (
    <HomeShell markets={MARKETS}>
      <BentoBoard />
    </HomeShell>
  );
}
