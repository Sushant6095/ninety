import { LeaderboardPage } from "../../features/leaderboard/LeaderboardPage";
import { getLeaderRows } from "../../lib/data/leaderboard";

// Leaderboard — LIVE (GET /leaderboard, lb:global · ADR-072). getLeaderRows degrades to the LEADERS fixture
// under NEXT_PUBLIC_USE_FIXTURES or on a live error. force-dynamic: rankings move, so never statically cache.
export const dynamic = "force-dynamic";

export default async function Page() {
  const leaders = await getLeaderRows();
  return <LeaderboardPage leaders={leaders} />;
}
