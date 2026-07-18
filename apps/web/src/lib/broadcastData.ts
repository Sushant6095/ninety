// Data source for the broadcast ticker (ADR-080). Pinned to a REAL football-data.org snapshot (baked, like the
// rest of the fixture-pinned web app); the live path fetches the same window from GET /rich/fixtures when live
// ingest/connect is on. Grouping is date-relative, so `now` is injected (deterministic + testable).
import raw from "../data/wc26/broadcast-fixtures.json";
import { groupFixtures, type BroadcastGroup } from "./broadcastFixtures";
import { getFixtures } from "./api";

const MATCHES = raw.matches;
const day = (nowMs: number, offset: number) => new Date(nowMs + offset * 86_400_000).toISOString().slice(0, 10);

/** Pinned real-snapshot groups. */
export const broadcastGroups = (nowMs: number): BroadcastGroup[] => groupFixtures(MATCHES, nowMs);

/** Live path: one call for the whole window (today-3 … today+1), grouped. Falls to the caller's catch on failure. */
export async function broadcastGroupsLive(nowMs: number): Promise<BroadcastGroup[]> {
  const r = (await getFixtures("2000", day(nowMs, -3), day(nowMs, 1))) as { data?: { matches?: unknown[] } };
  return groupFixtures((r.data?.matches ?? []) as never[], nowMs);
}
