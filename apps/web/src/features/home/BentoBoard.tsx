import { Reveal } from "../../components/ui/Reveal";
import { BentoGrid } from "../../components/vendor/magicui/bento-grid";
import { TopMovers } from "./TopMovers";
import { PowerRankings } from "./PowerRankings";
import { TradersWeek } from "./TradersWeek";
import { NewsStrip } from "./NewsStrip";

/** The board's below-the-board dashboard as a bento (re-skinned magicui bento-grid) with real
 *  hierarchy, not a uniform card grid: movers own the full first row, the power rankings run tall
 *  beside the traders + booth-feed stack. Mobile stays the single-column stack. Group standings live
 *  on their own dedicated /competition surface (the real, airtight 12-group table) — a fabricated
 *  duplicate here clashed with the R16 fixture slate (same-group teams shown as R16 opponents), so it
 *  was removed rather than left to contradict. The FeaturedPanel stays the dashboard's hero above/
 *  beside this grid (right rail at xl, MobileFeatured below) — moving it into a cell would mount a
 *  second MomentumRiver. */
export function BentoBoard() {
  return (
    <BentoGrid>
      <Reveal className="min-w-0 lg:col-span-6"><TopMovers /></Reveal>
      <Reveal className="h-full min-w-0 lg:col-span-2 lg:row-span-2"><PowerRankings /></Reveal>
      <Reveal className="min-w-0 lg:col-span-4"><TradersWeek /></Reveal>
      <Reveal className="min-w-0 lg:col-span-4"><NewsStrip /></Reveal>
    </BentoGrid>
  );
}
