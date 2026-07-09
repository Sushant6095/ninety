import { LeaderboardPage } from "../../features/leaderboard/LeaderboardPage";
import { LEADERS } from "../../lib/fixtures";

// Leaderboard — backend-ready (GET /leaderboard, lb:global). Fixture-wired until the API boots live (BLOCKED B2).
export default function Page() {
  return <LeaderboardPage leaders={LEADERS} />;
}
