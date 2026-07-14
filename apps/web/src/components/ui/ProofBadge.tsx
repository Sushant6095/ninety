import { ShieldCheck } from "lucide-react";

interface ProofBadgeProps {
  sig: string; // Solana tx signature (devnet)
  label?: string; // "Settled on-chain" | "Minted" | …
  className?: string;
}

const SOLSCAN = (sig: string): string => `https://solscan.io/tx/${encodeURIComponent(sig)}?cluster=devnet`;
// Truncate a raw base58 sig to head…tail; leave already-elided display strings (containing …) alone.
const short = (sig: string): string => (sig.includes("…") || sig.length <= 12 ? sig : `${sig.slice(0, 4)}…${sig.slice(-4)}`);

/** The ONE on-chain surface in the app — violet (chain token) ONLY. A verified proof/mint sig → Solscan devnet.
 *  Used on SETTLED markets and minted Moments. Never decorative; violet appears nowhere else. */
export function ProofBadge({ sig, label = "Proof on Solana", className = "" }: ProofBadgeProps) {
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
