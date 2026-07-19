import Link from "next/link";
import { History, ArrowRight } from "lucide-react";
import { AppShell } from "../../../components/ui/AppShell";
import { routes } from "../../../lib/routes";

// Replay route — the finished-match replayer surface. Wired to the ingest replay plane later
// (ADR-021); until then it renders the shell + an honest, DESIGNED empty state (icon + escape hatch,
// never a bare dead-end) so a visitor who lands here has somewhere to go.
export default function Page() {
  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[1040px] flex-1 place-items-center px-4 py-16 sm:px-6">
        <div className="max-w-[46ch] text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-chain/10 ring-1 ring-inset ring-chain/30">
            <History className="h-6 w-6 text-chain" aria-hidden strokeWidth={2} />
          </span>
          <h1 className="mt-5 font-display text-display font-bold tracking-tight text-hi">Replay is warming up</h1>
          <p className="mt-2 text-body leading-relaxed text-lo">
            Finished matches will replay here minute by minute — every price move, every halt, every settle — so you can
            watch the swing you missed. No match has settled to replay yet.
          </p>
          <Link
            href={routes.board}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-chip bg-up px-5 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:scale-[0.97]"
          >
            Watch a live match <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
