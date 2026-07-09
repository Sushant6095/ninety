import { HomeShell } from "../features/home/HomeShell";
import { MatchListSkeleton } from "../features/home/MatchListSkeleton";

// Home. Shell (chunk 1). The grouped match list mounts in the center (chunk 4); until then, the skeleton.
export default function Home() {
  return (
    <HomeShell>
      <MatchListSkeleton rows={3} />
    </HomeShell>
  );
}
