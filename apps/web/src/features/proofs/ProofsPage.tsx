import Link from "next/link";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { ProofBadge } from "../../components/ui/ProofBadge";
import { routes } from "../../lib/routes";
import { PROOFS, PROOFS_TOTAL, type Proof } from "../../lib/proofs";

const REPO = "https://github.com/Sushant6095/ninety/blob/main/docs/adr";
const ADR_036 = `${REPO}/ADR-036-settle-market-txoracle-cpi-statkey-binding.md`;
const ADR_037 = `${REPO}/ADR-037-settle-statkeys-1-2-game-finalised-failclosed.md`;

const fmtVol = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n));
const fmtNum = (n: number): string => n.toLocaleString("en-US");

function ProofRow({ p }: { p: Proof }) {
  const draw = p.outcome === "D";
  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3.5">
      <span className="flex items-center -space-x-1.5">
        <TeamCrest code={p.homeCode} size={26} className="ring-1 ring-bg" />
        <TeamCrest code={p.awayCode} size={26} className="ring-1 ring-bg" />
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
          {p.stage} · result {p.decidedAt} · {fmtVol(p.volume)} CR · {fmtNum(p.traders)} traders
        </div>
      </div>

      {/* the ONE on-chain surface — violet. Fail-closed today, so it reads the honest "proof pending" state
          (never a dead Solscan link); it flips to a Solscan-verifiable badge the moment a real settle tx exists. */}
      <ProofBadge label="Settled on-chain" pendingLabel="Proof pending" className="hidden sm:inline-flex" />
    </li>
  );
}

/** Proofs — the result + settlement log. The result is TxLINE's (consensus decides who won, no admin path). The
 *  on-chain proof is fail-closed on purpose: a forgeable path was found in the sanctioned oracle, so settlement
 *  was disabled rather than shipped (ADR-036 / ADR-037). We link the decision, never a 404. */
export function ProofsPage() {
  return (
    <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="font-display text-display font-bold tracking-tight text-hi">Proofs</h1>
        <p className="mt-1 max-w-[64ch] text-body leading-relaxed text-lo">
          Every result is decided by TxLINE consensus. No admin can change it. The on-chain settle proof is
          <span className="text-hi"> fail-closed on purpose</span>: reviewing the sanctioned oracle we found
          <span className="num text-hi"> validate_stat_v2</span> does not bind finality on-chain, so a genuine
          mid-match proof could settle a wrong result. We disabled settlement rather than ship something we can
          prove is forgeable. Proofs go live the moment that finality binding is confirmed.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-card border border-hairline bg-surface px-4 py-3">
        <span className="num text-strong font-semibold tabular-nums text-hi">{PROOFS_TOTAL}<span className="ml-1.5 text-label font-medium uppercase tracking-wide text-lo">results decided</span></span>
        <span className="text-label uppercase tracking-label text-lo">Result · TxLINE consensus</span>
        <span className="text-label uppercase tracking-label text-chain">Settlement · fail-closed (ADR-036/037)</span>
      </div>

      <div className="overflow-hidden rounded-card border border-hairline bg-surface">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-2 text-label font-semibold uppercase tracking-label text-lo">
          <span>Result</span>
          <span className="hidden sm:inline">On-chain proof</span>
        </div>
        <ul className="divide-y divide-hairline/60">
          {PROOFS.map((p) => <ProofRow key={p.id} p={p} />)}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <p className="max-w-[64ch] text-label leading-relaxed text-lo">
          Why disabled, and what unblocks it: the finding and the path back to live settlement are recorded in
          {" "}
          <a href={ADR_036} target="_blank" rel="noopener noreferrer" className="text-chain underline decoration-chain/60 underline-offset-2 outline-none transition-colors duration-200 hover:decoration-chain focus-visible:ring-2 focus-visible:ring-chain focus-visible:rounded-sm">ADR-036</a>
          {" and "}
          <a href={ADR_037} target="_blank" rel="noopener noreferrer" className="text-chain underline decoration-chain/60 underline-offset-2 outline-none transition-colors duration-200 hover:decoration-chain focus-visible:ring-2 focus-visible:ring-chain focus-visible:rounded-sm">ADR-037</a>.
        </p>
        <Link href={routes.howItWorks} className="text-label text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:underline">How settlement works →</Link>
      </div>
    </main>
  );
}
