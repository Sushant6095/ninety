import { AppShell } from "../../components/ui/AppShell";
import { ProofsPage } from "../../features/proofs/ProofsPage";

// Proofs — the on-chain settlement proof log (TxLINE consensus → Solana devnet). Results are TxLINE's; Solana
// holds the immutable proof. No admin result path (ADR-051).
export default function Page() {
  return (
    <AppShell>
      <ProofsPage />
    </AppShell>
  );
}
