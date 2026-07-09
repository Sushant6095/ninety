import { StubScreen } from "../../../components/ui/StubScreen";

// Match view — deferred (ADR-042: amm.q/spread_mult null until the engine q-emit). Route is live so Home links land.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StubScreen name="Match view" note={`Live trading for ${id} is next — waiting on the engine amm.q feed (ADR-042). The route is live.`} />;
}
