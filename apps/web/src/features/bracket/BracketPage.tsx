import Link from "next/link";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { Flag } from "../../components/ui/Flag";
import { routes } from "../../lib/routes";
import { SESSION } from "../../lib/fixtures";
import { BRACKET, type Tie } from "../../lib/bracket";
import { fmtPrice } from "../../lib/format";

function TeamRow({ code, prob, lead }: { code: string | null; prob: number | null; lead: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      {code ? <Flag code={code} size={18} /> : <span className="h-[18px] w-[18px] shrink-0 rounded-full bg-hairline/60 ring-1 ring-inset ring-hairline" aria-hidden />}
      <span className={`flex-1 truncate text-body font-medium ${code ? (lead ? "text-hi" : "text-hi/80") : "text-lo"}`}>{code ?? "TBD"}</span>
      {prob != null ? (
        <span className={`num rounded-md px-1.5 py-0.5 text-caption font-semibold tabular-nums ring-1 ring-inset ${lead ? "bg-hairline/40 text-hi ring-hairline" : "bg-bg/50 text-hi/80 ring-hairline/60"}`}>{fmtPrice(prob)}</span>
      ) : (
        <span className="num text-caption text-lo">—</span>
      )}
    </div>
  );
}

function TieCard({ tie }: { tie: Tie }) {
  const homeLead = (tie.homeProb ?? 0) >= (tie.awayProb ?? 0);
  const badge =
    tie.status === "LIVE" ? <span className="num text-label font-semibold text-up">{tie.minute}&#39; LIVE</span>
    : tie.status === "UPCOMING" ? <span className="num text-label font-medium tabular-nums text-lo">{tie.time}</span>
    : <span className="text-label font-medium uppercase tracking-wide text-lo">TBD</span>;

  const inner = (
    <div className={`rounded-card border p-2 transition-colors duration-200 ${tie.matchId ? "elev border-hairline bg-surface group-hover:bg-hairline/15 group-hover:border-hairline" : "border-hairline/60 bg-bg/40"}`}>
      <TeamRow code={tie.home} prob={tie.homeProb} lead={!!tie.home && homeLead} />
      <div className="mx-1 border-t border-hairline/60" />
      <TeamRow code={tie.away} prob={tie.awayProb} lead={!!tie.away && !homeLead} />
      <div className="mt-1 px-1">{badge}</div>
    </div>
  );

  if (!tie.matchId) return <div className="w-[220px] shrink-0">{inner}</div>;
  return (
    <Link href={routes.match(tie.matchId)} aria-label={`${tie.home} vs ${tie.away} — open market`} className="group block w-[220px] shrink-0 outline-none">
      {inner}
    </Link>
  );
}

export function BracketPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader user={SESSION} />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="font-display text-display font-bold tracking-tight text-hi">Competition</h1>
          <p className="mt-1 text-body text-lo">World Cup 2026 knockout bracket. Prices are live advance probabilities — tap a tie to trade.</p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-5">
            {BRACKET.map((round) => (
              <section key={round.short} className="flex flex-col" aria-label={round.name}>
                <h2 className="mb-3 text-label font-semibold uppercase tracking-[0.12em] text-lo">{round.name}</h2>
                <div className="flex flex-1 flex-col justify-around gap-4">
                  {round.ties.map((tie) => (
                    <TieCard key={tie.id} tie={tie} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
