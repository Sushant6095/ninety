import { HomeShell } from "../features/home/HomeShell";
import { MatchList } from "../features/home/MatchList";
import { MARKETS } from "../lib/fixtures";

// Home. Center hero = the grouped match list (chunks 2+4). Fixture-wired; chunk 5 swaps for GET /markets.
export default function Home() {
  return (
    <HomeShell>
      <MatchList markets={MARKETS} />
    </HomeShell>
  );
}
