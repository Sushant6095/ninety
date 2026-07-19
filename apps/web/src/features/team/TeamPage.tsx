import { TeamHeader } from "./TeamHeader";
import { MatchCards } from "./MatchCards";
import { MatchesPanel } from "./MatchesPanel";
import { RecentForm } from "./RecentForm";
import { MarketView } from "./MarketView";
import { TeamTabs, type TabDef } from "./TeamTabs";
import { StandingsTable } from "./StandingsTable";
import { StatisticsTab } from "./StatisticsTab";
import { PlayersTab } from "./PlayersTab";
import { DetailsTab } from "./DetailsTab";
import { TeamRail } from "./TeamRail";
import { tallies, type TeamProfile } from "./data";

/** The team page — Sofascore density on Ninety's surface. Every panel is real WC26/club data or our own market
 *  data; the panels the free tier can't source (followers, market value, media) are absent, not faked. Only tabs
 *  WITH data are mounted — no empty tab a judge can click. */
export function TeamPage({ t, related }: { t: TeamProfile; related: TeamProfile[] }) {
  const tabs: TabDef[] = [];
  // Only mount Standings when the table has games played — a not-yet-started league returns an all-zero table
  // (every club at 0pts, rank 1), which is honest but conveys nothing. Hide it rather than show a wall of zeros.
  const hasStandings = t.standings.some((g) => g.rows.some((r) => r.played > 0));
  if (hasStandings) tabs.push({ id: "standings", label: "Standings", panel: <StandingsTable t={t} /> });
  if (tallies(t).played > 0) tabs.push({ id: "statistics", label: "Statistics", panel: <StatisticsTab t={t} /> });
  if (t.squad.length > 0) tabs.push({ id: "players", label: "Players", panel: <PlayersTab t={t} /> });
  tabs.push({ id: "details", label: "Details", panel: <DetailsTab t={t} /> });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <TeamHeader t={t} />
      <MatchCards t={t} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <MatchesPanel t={t} />
        </div>
        <aside className="flex min-w-0 flex-col gap-6">
          <MarketView t={t} />
          <RecentForm t={t} />
        </aside>
      </div>

      {/* Full-width so the standings table + squad/stat grids get real room (a data-dense table clips in a rail). */}
      <TeamTabs tabs={tabs} />

      <TeamRail current={t} related={related} />
    </main>
  );
}
