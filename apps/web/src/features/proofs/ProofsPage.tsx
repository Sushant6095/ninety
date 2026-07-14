import Link from "next/link";
import { Flag } from "../../components/ui/Flag";
import { ProofBadge } from "../../components/ui/ProofBadge";
import { routes } from "../../lib/routes";
import { PROOFS, PROOFS_TOTAL, type Proof } from "../../lib/proofs";

const fmtSlot = (n: number): string => n.toLocaleString("en-US");
const fmtVol = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n));

function ProofRow({ p }: { p: Proof }) {
  const draw = p.outcome === "D";
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5">
      <span className="flex items-center -space-x-1.5">
        <Flag code={p.homeCode} size={26} className="ring-1 ring-bg" />
        <Flag code={p.awayCode} size={26} className="ring-1 ring-bg" />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="num text-strong font-semibold tabular-nums text-hi">{p.homeCode} v {p.awayCode}</span>
          <span className="num rounded bg-bg px-1.5 py-0.5 text-caption font-semibold tabular-nums text-hi ring-1 ring-inset ring-hairline">{p.score}</span>
          <span className={`rounded-chip px-1.5 py-0.5 text-label font-semibold ring-1 ring-inset ${draw ? "bg-hairline/60 text-lo ring-hairline" : "bg-up/10 text-up ring-up/25"}`}>
            {draw ? "Draw" : `${p.winnerCode} won`}
          </span>
        </div>
        <div className="num mt-1 text-label tabular-nums text-lo">
          {p.stage} · settled {p.settledAt} · slot {fmtSlot(p.slot)} · {fmtVol(p.volume)} CR · {fmtSlot(p.traders)} traders
        </div>
      </div>

      {/* the ONE on-chain surface — violet, verifiable on Solscan devnet */}
      <ProofBadge sig={p.txSig} label="Settled on-chain" className="hidden sm:inline-flex" />
    </li>
  );
}

/** Proofs — the settlement proof log. The result is TxLINE's (consensus decides who won); Solana devnet holds
 *  the immutable proof (the settle tx). No admin result path exists (ADR-051 / proof.rs). Play money throughout. */
export function ProofsPage() {
  return (
    <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-display font-bold tracking-tight text-hi">Proofs</h1>
        <p className="mt-1 max-w-[62ch] text-body leading-relaxed text-lo">
          Every settled market, proved on-chain. TxLINE consensus decides the result; Solana devnet holds the
          proof — anyone can verify it. No admin can change a result.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-hairline bg-surface px-4 py-3">
        <span className="num text-strong font-semibold tabular-nums text-hi">{PROOFS_TOTAL}<span className="ml-1.5 text-label font-medium uppercase tracking-wide text-lo">settled</span></span>
        <span className="text-label uppercase tracking-[0.12em] text-lo">Result · TxLINE</span>
        <span className="text-label uppercase tracking-[0.12em] text-chain">Proof · Solana devnet</span>
      </div>

      <div className="overflow-hidden rounded-card border border-hairline bg-surface">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2 text-label font-semibold uppercase tracking-[0.12em] text-lo">
          <span>Market</span>
          <span className="hidden sm:inline">Proof</span>
        </div>
        <ul className="divide-y divide-hairline/60">
          {PROOFS.map((p) => <ProofRow key={p.id} p={p} />)}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-label text-lo">Older proofs archived on devnet.</span>
        <Link href={routes.howItWorks} className="text-label text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:underline">How settlement works →</Link>
      </div>
    </main>
  );
}
