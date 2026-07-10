import Link from "next/link";
import { TrendingUp, Radio, ShieldCheck, ArrowRight, type LucideIcon } from "lucide-react";
import { Ticker } from "../home/Ticker";
import { Footer } from "../home/Footer";
import { Wordmark } from "../../components/ui/Wordmark";
import { ScreenSwitcher } from "../../components/ui/ScreenSwitcher";
import { MomentumRiver } from "../../components/ui/MomentumRiver";
import { routes } from "../../lib/routes";

const SPARK = [30, 31, 30.5, 32, 33, 40, 48, 55, 54, 58, 60, 62, 61, 63, 64, 66, 65, 67, 68, 70, 69, 71.4];

const PILLARS: { icon: LucideIcon; title: string; body: string; tint: string }[] = [
  { icon: TrendingUp, title: "Markets, not odds", tint: "text-up", body: "TxLINE consensus odds become live LMSR markets. Every price is a market you can trade — it moves with the match, never a bookmaker's margin." },
  { icon: Radio, title: "The Booth narrates", tint: "text-hi", body: "A live AI desk explains every move — who repriced what, and why. Commentary and market impact, side by side, in plain language." },
  { icon: ShieldCheck, title: "Solana settles", tint: "text-chain", body: "TxLINE proofs verify the result on-chain. Settlement is permissionless and one-shot — no admin can override it. Play money, ever." },
];

const SURFACES: { name: string; desc: string; href: string; cta: string }[] = [
  { name: "The App", desc: "The discovery board — live matches, biggest movers, top traders, moments of the day.", href: routes.home, cta: "Open the app" },
  { name: "The Terminal", desc: "Pro match view — the Momentum River, the LMSR trade panel, your live P&L, and the Booth timeline.", href: routes.terminal, cta: "Open the terminal" },
  { name: "The Leaderboard", desc: "Every trade re-ranks the tournament board in real time as your P&L moves.", href: routes.leaders, cta: "See the board" },
];

/** North Star — the product-vision surface. States what Ninety is and links to the live App + Terminal. */
export function NorthStarScreen() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <Ticker />
      <header className="sticky top-0 z-30 border-b border-hairline bg-bg">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4 sm:px-6">
          <Wordmark tag="North Star" />
          <ScreenSwitcher className="hidden sm:inline-flex" />
          <Link href={routes.home} className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-up px-4 text-[13px] font-semibold text-bg transition-[filter] duration-200 hover:brightness-110">
            Enter the exchange <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 sm:px-6">
        {/* hero */}
        <section className="grid items-center gap-8 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div>
            <span className="num inline-flex items-center gap-2 rounded-chip bg-surface px-3 py-1 text-[11px] text-lo ring-1 ring-inset ring-hairline">
              <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_6px_var(--up)]" /> WC26 · live · play-money
            </span>
            <h1 className="mt-5 font-display text-[clamp(2.4rem,1rem+5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-hi">
              The live football<br />exchange.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-lo">
              Consensus odds become markets. An AI booth narrates every move. Solana settles the result — trustlessly, in credits that never cash out.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={routes.terminal} className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-up px-5 text-[14px] font-semibold text-bg transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.99]">
                Open the terminal <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href={routes.home} className="inline-flex min-h-[44px] items-center rounded-lg bg-surface px-5 text-[14px] font-semibold text-hi ring-1 ring-inset ring-hairline transition-colors duration-200 hover:ring-up/40">
                Browse matches
              </Link>
            </div>
          </div>
          <div className="elev-hi overflow-hidden rounded-card border border-hairline/70 bg-surface">
            <div className="flex items-center justify-between px-4 pt-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Momentum River — <span className="text-up">CAN win %</span></span>
              <span className="num text-[11px] text-up">61.4 ▲2.4</span>
            </div>
            <MomentumRiver data={SPARK} up height={220} goalIndex={5} />
            <div className="num flex items-center justify-between border-t border-hairline px-4 py-2 text-[9px] text-lo/60"><span>0&#39;</span><span>HT</span><span>74&#39;</span><span>90&#39;</span></div>
          </div>
        </section>

        {/* pillars */}
        <section className="grid gap-3 border-t border-hairline py-10 md:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className={`elev rounded-card border bg-surface p-5 ${p.tint === "text-chain" ? "border-chain/25" : "border-hairline/70"}`}>
                <span className={`grid h-10 w-10 place-items-center rounded-lg bg-bg ring-1 ring-inset ring-hairline ${p.tint}`}><Icon size={20} strokeWidth={2} aria-hidden /></span>
                <h2 className="mt-4 text-[16px] font-semibold text-hi">{p.title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-lo">{p.body}</p>
              </div>
            );
          })}
        </section>

        {/* surfaces */}
        <section className="border-t border-hairline py-10">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-lo">Three surfaces, one exchange</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {SURFACES.map((s) => (
              <Link key={s.name} href={s.href} className="elev group flex flex-col rounded-card border border-hairline/70 bg-surface p-5 transition-colors duration-200 hover:border-up/40">
                <h3 className="font-display text-[19px] font-bold text-hi">{s.name}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-lo">{s.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-up">{s.cta} <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* stats */}
        <section className="num flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-hairline py-8 text-[12px] text-lo">
          <span><span className="text-hi">48</span> teams</span><span className="text-hairline">·</span>
          <span><span className="text-hi">104</span> matches</span><span className="text-hairline">·</span>
          <span><span className="text-hi">LMSR</span> pricing</span><span className="text-hairline">·</span>
          <span>proofs on <span className="text-chain">Solana devnet</span></span><span className="text-hairline">·</span>
          <span><span className="text-hi">play-money</span> only</span>
        </section>
      </main>
      <Footer />
    </div>
  );
}
