import { HomeShell } from "../features/home/HomeShell";
import { TopMovers } from "../features/home/TopMovers";
import { TradersWeek } from "../features/home/TradersWeek";
import { NewsStrip } from "../features/home/NewsStrip";
import { GroupStandings } from "../features/home/GroupStandings";
import { PowerRankings } from "../features/home/PowerRankings";
import { Reveal } from "../components/ui/Reveal";
import { MARKETS } from "../lib/fixtures";

// Home = the lock-kit App board: match board (live/today/finished, grouped) → biggest movers → traders → booth
// news, with quiet rails. Live prices/scores flow from the ONE match store (seeded from MARKETS, drifted by
// the MatchLiveProvider in the root layout) — the same store the /terminal reads.
export default function Home() {
  return (
    <HomeShell markets={MARKETS}>
      <Reveal><TopMovers /></Reveal>
      <Reveal><GroupStandings /></Reveal>
      <Reveal><PowerRankings /></Reveal>
      <Reveal><TradersWeek /></Reveal>
      <Reveal><NewsStrip /></Reveal>
    </HomeShell>
  );
}
