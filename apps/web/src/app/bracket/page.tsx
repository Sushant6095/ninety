import { AppShell } from "../../components/ui/AppShell";
import { BracketB } from "../../features/bracket/BracketB";

// Competition bracket — the real 104-match WC26 knockout tree (road to the Final).
export default function Page() {
  return (
    <AppShell>
      <BracketB />
    </AppShell>
  );
}
