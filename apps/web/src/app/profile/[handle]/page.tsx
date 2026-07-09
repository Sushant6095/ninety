import { StubScreen } from "../../../components/ui/StubScreen";

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <StubScreen name={`@${handle}`} note="Trader profile — record, moments, and P&L. Next in the build; the route is live." />;
}
