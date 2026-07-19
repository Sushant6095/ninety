"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, LogOut } from "lucide-react";
import { TerminalHeader } from "../terminal/TerminalHeader";
import { Footer } from "../home/Footer";
import { routes } from "../../lib/routes";
import { useSession, useSignOut } from "../session/SessionProvider";

// Demo embedded devnet wallet, display form (truncated). Real-format base58 (no readable words); the live
// key is derived per-user at sign-in once auth lands (BLOCKERS B3). Under the PROTOTYPE banner.
const WALLET = "9pXk3nQvRb…Hs7fZ2k";

function Toggle({ label, desc, on, onToggle }: { label: string; desc: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-body font-medium text-hi">{label}</span>
        <span className="block text-caption text-lo">{desc}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-6 w-10 shrink-0 cursor-pointer rounded-chip ring-1 ring-inset outline-none transition-colors duration-200 focus-visible:ring-up ${on ? "bg-up/80 ring-up/60" : "bg-hairline ring-hairline"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg transition-transform duration-200 ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

const NOTIFS = [
  { key: "kickoff", label: "Match kickoff", desc: "When a market you follow goes live." },
  { key: "events", label: "Goals & red cards", desc: "Big swings on your open positions." },
  { key: "halts", label: "Market halts", desc: "When trading pauses on a key event." },
  { key: "settle", label: "Settlement", desc: "When a market resolves on-chain." },
] as const;

export function SettingsPage() {
  const session = useSession();
  const signOut = useSignOut();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Record<string, boolean>>({ kickoff: true, events: true, halts: false, settle: true });
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(WALLET); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };
  // Sign out clears this browser's identity and issues a fresh one, then returns to the landing.
  const onSignOut = () => { signOut(); router.push(routes.home); };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-bg">
      <TerminalHeader />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-5 font-display text-display font-bold tracking-tight text-hi">Settings</h1>

        {/* Account */}
        <section className="mb-5 overflow-hidden rounded-card border border-hairline bg-surface">
          <h2 className="border-b border-hairline px-4 py-3 text-label font-semibold uppercase tracking-label text-lo">Account</h2>
          <dl className="divide-y divide-hairline/60">
            <div className="flex items-center justify-between px-4 py-3"><dt className="text-body text-lo">Handle</dt><dd className="num text-body font-medium text-hi">{session.handle}</dd></div>
            <div className="flex items-center justify-between px-4 py-3"><dt className="text-body text-lo">Email</dt><dd className="text-body text-lo">Not linked</dd></div>
            <div className="flex items-center justify-between px-4 py-3"><dt className="text-body text-lo">Rank</dt><dd className={`text-body font-medium ${session.rank == null ? "text-lo" : "num text-hi"}`}>{session.rank == null ? "Unranked" : `#${session.rank}`}</dd></div>
          </dl>
        </section>

        {/* Notifications */}
        <section className="mb-5 overflow-hidden rounded-card border border-hairline bg-surface">
          <h2 className="border-b border-hairline px-4 py-3 text-label font-semibold uppercase tracking-label text-lo">Notifications</h2>
          <div className="divide-y divide-hairline/60">
            {NOTIFS.map((n) => (
              <Toggle key={n.key} label={n.label} desc={n.desc} on={!!notifs[n.key]} onToggle={() => setNotifs((s) => ({ ...s, [n.key]: !s[n.key] }))} />
            ))}
          </div>
        </section>

        {/* Wallet */}
        <section className="mb-5 overflow-hidden rounded-card border border-hairline bg-surface">
          <h2 className="border-b border-hairline px-4 py-3 text-label font-semibold uppercase tracking-label text-lo">Wallet</h2>
          <div className="px-4 py-3">
            <p className="text-caption text-lo">Your embedded Solana devnet wallet. Export the address to view settlements on Solscan.</p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-card border border-hairline bg-bg/40 px-4 py-3">
              <span className="num min-w-0 flex-1 truncate text-caption tabular-nums text-chain">{WALLET}</span>
              <button
                type="button"
                onClick={copy}
                aria-label="Copy wallet address"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-chip bg-surface px-3 py-1.5 text-caption font-medium text-hi ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-chain/40 focus-visible:ring-chain/40"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-up" aria-hidden strokeWidth={2.5} /> : <Copy className="h-3.5 w-3.5" aria-hidden strokeWidth={2} />}
                {copied ? "Copied" : "Export"}
              </button>
            </div>
          </div>
        </section>

        {/* Sign out — clears this identity and issues a fresh one. */}
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-chip bg-surface px-5 text-strong font-medium text-down ring-1 ring-inset ring-hairline outline-none transition-colors duration-200 hover:ring-down/40 focus-visible:ring-down/40 active:bg-hairline/40"
        >
          <LogOut className="h-4 w-4" aria-hidden strokeWidth={2} /> Sign out
        </button>
      </main>
      <Footer />
    </div>
  );
}
