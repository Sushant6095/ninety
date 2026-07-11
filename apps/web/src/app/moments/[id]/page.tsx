import { MomentDetail } from "../../../features/moments/MomentDetail";
import { StubScreen } from "../../../components/ui/StubScreen";
import { momentById } from "../../../lib/moments";

// Moment detail — full-bleed share card + ProofBadge → Solscan. Fixture-wired (GET /moments/:id).
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moment = momentById(id);
  if (!moment) return <StubScreen name="Moment not found" note="This moment isn't in the gallery yet. Browse the ones that are." />;
  return <MomentDetail m={moment} />;
}
