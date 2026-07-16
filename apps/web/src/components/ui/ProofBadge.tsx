import { ShieldCheck, Clock } from "lucide-react";

interface ProofBadgeProps {
  sig?: string | null; // Solana tx signature (devnet) — absent/elided while settlement is fail-closed
  label?: string; // "Settled on-chain" | "Minted" | …
  pendingLabel?: string; // honest text shown when there is no real sig yet
  className?: string;
}

const SOLSCAN = (sig: string): string => `https://solscan.io/tx/${sig}?cluster=devnet`;
// A real Solana signature is base58 and 87–88 chars. Anything shorter, empty, or elided (contains "…") is NOT a
// verifiable tx — we must never turn it into a Solscan href that 404s under "anyone can verify it".
const B58_SIG = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;
const isRealSig = (sig?: string | null): sig is string => !!sig && B58_SIG.test(sig);
const short = (sig: string): string => `${sig.slice(0, 4)}…${sig.slice(-4)}`;

/** The ONE on-chain surface in the app — violet (chain token) ONLY. When a REAL settle/mint signature exists it
 *  links Solscan devnet (a proof anyone can verify). Settlement is currently fail-closed on purpose (ADR-036 /
 *  ADR-037): a forgeable path was found in the sanctioned oracle, so settlement was DISABLED rather than shipped
 *  and there is NO real settle tx to link. In that state this renders an honest, non-interactive "pending" chip —
 *  never a dead Solscan href. It goes live automatically the moment a real signature is passed in. */
export function ProofBadge({ sig, label = "Proof on Solana", pendingLabel = "Proof pending — settlement disabled", className = "" }: ProofBadgeProps) {
  if (!isRealSig(sig)) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-chip bg-chain/10 px-3 py-1.5 ring-1 ring-inset ring-chain/40 ${className}`}
        title={pendingLabel}
      >
        <Clock className="h-3.5 w-3.5 text-chain" aria-hidden strokeWidth={2.25} />
        <span className="text-label font-medium text-chain">{pendingLabel}</span>
      </span>
    );
  }
  return (
    <a
      href={SOLSCAN(sig)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — view signature ${sig} on Solscan devnet`}
      className={`group inline-flex items-center gap-2 rounded-chip bg-chain/10 px-3 py-1.5 ring-1 ring-inset ring-chain/40 outline-none transition-colors duration-200 hover:bg-chain/15 focus-visible:bg-chain/15 ${className}`}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-chain" aria-hidden strokeWidth={2.25} />
      <span className="text-label font-medium text-chain">{label}</span>
      <span className="num text-label tabular-nums text-chain">{short(sig)}</span>
    </a>
  );
}
