import { AppShell } from "../../../components/ui/AppShell";

// Replay route — the finished-match replayer surface. Wired to the ingest replay plane later
// (ADR-021); until then it renders the shell + an honest empty state (never a bare page).
export default function Page() {
  return (
    <AppShell>
      <main className="mx-auto grid w-full max-w-[1040px] flex-1 place-items-center px-4 py-16 sm:px-6">
        <div className="max-w-[42ch] text-center">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Replay is warming up</h1>
          <p className="mt-2 text-body leading-relaxed text-lo">
            Finished matches will replay here minute by minute — every price move, every halt, every settle — so you can
            watch the swing you missed. Nothing to replay yet tonight.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
