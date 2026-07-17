import { notFound } from "next/navigation";
import { MomentDetail } from "../../../features/moments/MomentDetail";
import { getMomentDetail } from "../../../lib/data/moments";

// Moment detail — full-bleed share card + ProofBadge → Solscan. Live GET /moments/:id (fixtures offline).
// force-dynamic: the live moment set changes per request; never statically cache a stale/absent moment.
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moment = await getMomentDetail(id);
  if (!moment) notFound(); // real 404 — never silently fall back to another moment
  return <MomentDetail m={moment} />;
}
