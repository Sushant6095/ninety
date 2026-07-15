"use client";
import { useState } from "react";
import Link from "next/link";
import { Share2, Link2, Check } from "lucide-react";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { Avatar } from "../../components/ui/Avatar";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { ProofBadge } from "../../components/ui/ProofBadge";
import { routes } from "../../lib/routes";
import { SESSION } from "../../lib/fixtures";
import { rarityOf, swingOf, RARITY_STYLE, type Moment } from "../../lib/moments";
import { fmtPrice, signedCR } from "../../lib/format";

function Action({ onClick, active, icon, label, activeLabel }: { onClick: () => void; active: boolean; icon: React.ReactNode; label: string; activeLabel: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-chip bg-bg/40 px-4 py-2.5 text-strong font-medium text-hi ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-up/40 focus-visible:ring-up/40 active:bg-hairline/40"
    >
      {active ? <Check className="h-4 w-4 text-up" aria-hidden strokeWidth={2.25} /> : icon}
      {active ? activeLabel : label}
    </button>
  );
}

export function MomentDetail({ m }: { m: Moment }) {
  const [copied, setCopied] = useState<"share" | "copy" | null>(null);
  const rarity = rarityOf(m);
  const swing = swingOf(m);
  const up = swing >= 0;

  const url = typeof window !== "undefined" ? window.location.href : "";
  const flash = (k: "share" | "copy") => { setCopied(k); window.setTimeout(() => setCopied(null), 1500); };
  const share = async () => {
    try {
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (nav.share) await nav.share({ title: m.title, text: `${m.pick} ${m.fromPrice} → ${m.toPrice} — a ${rarity} moment on Ninety`, url });
      else { await navigator.clipboard.writeText(url); flash("share"); }
    } catch { /* user dismissed share sheet — no-op */ }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(url); flash("copy"); } catch { /* clipboard blocked */ } };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader user={SESSION} />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-6 sm:px-6">
        <Link href={routes.moments} className="mb-4 inline-flex items-center gap-1 text-caption font-medium text-lo transition-colors duration-200 hover:text-hi">← Moments</Link>

        {/* Full-bleed share card */}
        <article className="elev-hi overflow-hidden rounded-card border border-hairline bg-surface">
          <div className="flex items-center justify-between px-5 pt-5">
            <span className={`rounded-chip px-2.5 py-0.5 text-label font-semibold uppercase tracking-micro ring-1 ring-inset ${RARITY_STYLE[rarity]}`}>{rarity}</span>
            <span className="num text-caption font-semibold tabular-nums text-lo">{m.minute}&#39;</span>
          </div>

          <div className="px-5 pt-3">
            <div className="flex items-center gap-2">
              <TeamCrest code={m.homeCode} size={20} />
              <TeamCrest code={m.awayCode} size={20} />
              <span className="num text-caption tabular-nums text-lo">{m.homeCode} v {m.awayCode} · World Cup 2026</span>
            </div>
            <h1 className="mt-2 font-display text-display font-bold tracking-tight text-hi">{m.title}</h1>
          </div>

          {/* Annotated river segment */}
          <div className="mt-4 px-2">
            <EquityCurve values={m.segment} up={up} height={200} />
          </div>
          <div className="flex items-baseline justify-center gap-3 px-5 pb-1">
            <span className="num text-heading font-semibold tabular-nums text-lo">{fmtPrice(m.fromPrice)}</span>
            <span className="text-lo" aria-hidden>→</span>
            <span className="num text-heading font-semibold tabular-nums text-hi">{fmtPrice(m.toPrice)}</span>
            <span className={`num text-strong font-semibold tabular-nums ${up ? "text-up" : "text-down"}`}>{signedCR(swing)}</span>
          </div>
          <p className="px-5 pb-4 pt-1 text-center text-caption text-lo">{m.pick} win probability — repriced inside a single minute.</p>

          {/* Owner + chain surface */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-5 py-4">
            <Link href={routes.profile(m.owner)} className="group inline-flex items-center gap-2">
              <Avatar handle={m.owner} size={28} />
              <span className="text-caption text-lo transition-colors duration-200 group-hover:text-hi">Captured by <span className="text-hi">{m.owner}</span></span>
            </Link>
            {m.mintSig ? (
              <ProofBadge sig={m.mintSig} label="Minted" />
            ) : (
              <span className="text-label font-medium uppercase tracking-wide text-lo">Mintless — not on-chain</span>
            )}
          </div>
        </article>

        <div className="mt-4 flex gap-3">
          <Action onClick={share} active={copied === "share"} icon={<Share2 className="h-4 w-4" aria-hidden strokeWidth={2} />} label="Share" activeLabel="Link copied" />
          <Action onClick={copy} active={copied === "copy"} icon={<Link2 className="h-4 w-4" aria-hidden strokeWidth={2} />} label="Copy link" activeLabel="Copied" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
