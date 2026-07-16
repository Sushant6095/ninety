// On-chain proof history — every settlement this account traded in. Result + realized P&L from the fills;
// the receipt is the ProofBadge → Solscan devnet (the ONE violet surface on /account, per chain-token law).
// A settled fill whose proof sits outside the curated slice links into the full /proofs log instead — never
// a fabricated signature.
import Link from "next/link";
import { ProofBadge } from "../../components/ui/ProofBadge";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { routes } from "../../lib/routes";
import { FILLS } from "../../lib/portfolio";
import { PROOFS } from "../../lib/proofs";
import { signedCR } from "../../lib/format";

export function ProofHistoryList() {
  const settled = FILLS.filter((f) => f.status === "SETTLED");
  const proofByMatch = new Map(PROOFS.map((p) => [p.matchId, p]));

  if (settled.length === 0) {
    return (
      <div className="grid place-items-center px-4 py-14 text-center">
        <p className="text-body text-lo">No settlements yet — your first settled trade lands its proof here.</p>
        <Link
          href={routes.proofs}
          className="mt-2 rounded-chip px-2 py-1 text-body text-up outline-none transition-opacity duration-200 hover:opacity-80 focus-visible:ring-1 focus-visible:ring-up/40 active:scale-[0.97]"
        >
          Browse the proof log →
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline/60">
      {settled.map((f) => {
        const proof = proofByMatch.get(f.matchId);
        const gain = (f.pnl ?? 0) >= 0;
        return (
          <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <TeamCrest code={f.homeCode} size={20} />
              <TeamCrest code={f.awayCode} size={20} />
              <span className="min-w-0">
                <span className="block truncate text-strong font-medium text-hi">
                  {f.homeCode} v {f.awayCode}
                  {proof && <span className="num ml-2 text-caption tabular-nums text-lo">{proof.score}</span>}
                </span>
                <span className="num mt-0.5 block text-caption tabular-nums text-lo">
                  {f.pick} · {f.shares} sh · <span className={gain ? "text-up" : "text-down"}>{signedCR(f.pnl ?? 0)}</span> · {f.ts}
                </span>
              </span>
            </span>
            {/* Mintless mode (credibility fix, ADR-065): Proof carries NO tx signature until a real
                settle tx exists — a fabricated sig on a violet badge is worse than a link. Every row
                routes to the proof log; the Solscan ProofBadge returns when the sig field does. */}
            <Link
              href={routes.proofs}
              className="rounded-chip px-2 py-1.5 text-caption font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-1 focus-visible:ring-hairline active:scale-[0.97]"
            >
              in proof log →
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
