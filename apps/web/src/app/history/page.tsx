import { HistoryPage } from "../../features/portfolio/HistoryPage";

// History — every fill with match context + filters. Fixture-wired (GET /me/history), swaps 1:1 when the API boots.
export default function Page() {
  return <HistoryPage />;
}
