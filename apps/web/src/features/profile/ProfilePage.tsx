import Link from "next/link";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { Avatar } from "../../components/ui/Avatar";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { MomentCard } from "../../components/ui/MomentCard";
import { routes } from "../../lib/routes";
import { SESSION } from "../../lib/fixtures";
import { resolveProfile } from "../../lib/profile";
import { momentsByOwner } from "../../lib/moments";
import { fmtCR, signedCR } from "../../lib/format";

function Stat({ label, value, tone = "hi" }: { label: string; value: string; tone?: "hi" | "up" | "down" }) {
  const color = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-hi";
  return (
    <div className="rounded-card border border-hairline bg-bg/40 px-4 py-3">
      <div className="text-label font-medium uppercase tracking-[0.1em] text-lo">{label}</div>
      <div className={`num mt-1 text-heading font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export function ProfilePage({ handle }: { handle: string }) {
  const p = resolveProfile(handle);
  const moments = momentsByOwner(p.handle);
  const gain = p.pnl >= 0;
  const streakLabel = p.streak === 0 ? "—" : `${Math.abs(p.streak)}${p.streak > 0 ? "W" : "L"}`;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader user={SESSION} />
      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 sm:px-6">
        {/* HERO */}
        <section className="elev overflow-hidden rounded-card border border-hairline bg-surface">
          <div className="flex flex-wrap items-center gap-4 px-5 pt-5">
            <Avatar handle={p.handle} size={64} />
            <div className="min-w-0">
              <h1 className="font-display text-display font-bold tracking-tight text-hi">{p.handle}</h1>
              <p className="num mt-1 text-caption tabular-nums text-lo">Rank #{p.rank} · {p.trades} trades · joined {p.joined}</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-label font-medium uppercase tracking-[0.1em] text-lo">Net P&amp;L</div>
              <div className={`num text-display font-semibold tabular-nums ${gain ? "text-up" : "text-down"}`}>{signedCR(p.pnl)}</div>
            </div>
          </div>
          <div className="mt-4 px-1">
            <EquityCurve values={p.curve} up={gain} height={104} />
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <Stat label="Win rate" value={`${Math.round(p.winRate * 100)}%`} />
            <Stat label="Best swing" value={`+${fmtCR(p.bestSwing)}`} tone="up" />
            <Stat label="Streak" value={streakLabel} tone={p.streak > 0 ? "up" : p.streak < 0 ? "down" : "hi"} />
            <Stat label="Trades" value={fmtCR(p.trades)} />
          </div>
        </section>

        {/* MOMENTS SHELF */}
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-strong font-semibold text-hi">Moments</h2>
            <span className="num text-caption text-lo">{moments.length}</span>
          </div>
          {moments.length === 0 ? (
            <div className="grid place-items-center rounded-card border border-hairline bg-surface px-4 py-12 text-center">
              <p className="text-body text-lo">No captured moments yet.</p>
              <Link href={routes.moments} className="mt-2 text-body text-up transition-opacity duration-200 hover:opacity-80">Browse the gallery →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moments.map((m) => (
                <MomentCard key={m.id} m={m} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
