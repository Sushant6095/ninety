import { PlayerHeader } from "./PlayerHeader";
import { PlayerTabs } from "./PlayerTabs";
import { MatchesTable } from "./MatchesTable";
import { SeasonPanel } from "./SeasonPanel";
import { NinetyIndex } from "./NinetyIndex";
import { MarketImpact } from "./MarketImpact";
import { PlayerRail } from "./PlayerRail";
import { proseFor, type PlayerProfile } from "./data";

/** The player page — Sofascore density on Ninety's surface. Every panel is real WC26 data or our own market data;
 *  the panels the free tier can't source (value, followers, official rating radar, heatmaps) are absent, not faked. */
export function PlayerPage({ p }: { p: PlayerProfile }) {
  const tabs = [
    { id: "matches", label: "Matches", panel: <MatchesTable p={p} /> },
    { id: "season", label: "Season", panel: <SeasonPanel p={p} /> },
  ];
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <PlayerHeader p={p} />

      <p className="text-body text-lo">{proseFor(p)}</p>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <PlayerTabs tabs={tabs} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <NinetyIndex axes={p.ninetyIndex} />
          <MarketImpact p={p} />
        </aside>
      </div>

      <PlayerRail currentId={p.id} />
    </main>
  );
}
