import { AppShell } from "../../components/ui/AppShell";
import { GroupTable } from "./GroupTable";
import { GROUPS } from "../../data/wc26";

/** /competition — all 12 WC26 group tables. A real football-browse surface built on baked
 *  worldcup26 context (static standings), never a live feed. */
export function CompetitionPage() {
  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Group stage</h1>
          <p className="mt-1 text-body text-lo">
            All 12 groups: the top two of each, plus the eight best third-placed teams, advance to the Round of 32. Standings from the World Cup 2026 fixtures.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map((g) => (
            <GroupTable key={g.name} group={g} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
