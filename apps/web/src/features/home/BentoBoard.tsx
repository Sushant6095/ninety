import { Reveal } from "../../components/ui/Reveal";
import { BentoGrid } from "../../components/vendor/magicui/bento-grid";
import { TopMovers } from "./TopMovers";
import { GroupStandings } from "./GroupStandings";
import { PowerRankings } from "./PowerRankings";
import { TradersWeek } from "./TradersWeek";
import { NewsStrip } from "./NewsStrip";

/** The board's below-the-board dashboard as a bento (re-skinned magicui bento-grid) with real
 *  hierarchy, not a uniform card grid: movers own the full first row, standings take the wide
 *  middle cell with the power rankings running tall beside them, traders fill under the
 *  standings, and the booth feed closes full-width. Mobile stays the single-column stack.
 *  The FeaturedPanel stays the dashboard's hero above/beside this grid (right rail at xl,
 *  MobileFeatured below) — moving it into a cell would mount a second MomentumRiver. */
export function BentoBoard() {
  return (
    <BentoGrid>
      <Reveal className="min-w-0 lg:col-span-6"><TopMovers /></Reveal>
      <Reveal className="min-w-0 lg:col-span-4"><GroupStandings /></Reveal>
      <Reveal className="h-full min-w-0 lg:col-span-2 lg:row-span-2"><PowerRankings /></Reveal>
      <Reveal className="min-w-0 lg:col-span-4"><TradersWeek /></Reveal>
      <Reveal className="min-w-0 lg:col-span-6"><NewsStrip /></Reveal>
    </BentoGrid>
  );
}
