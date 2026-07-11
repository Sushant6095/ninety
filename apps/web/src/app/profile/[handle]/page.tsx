import { ProfilePage } from "../../../features/profile/ProfilePage";

// Profile — stats + moments shelf. Fixture-resolved (GET /profile/:handle); any handle renders so links never
// dead-end. Curated for known traders, deterministic synth otherwise; swaps for DB aggregates when the API boots.
export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <ProfilePage handle={handle} />;
}
