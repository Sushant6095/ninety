"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Wallet, Check } from "lucide-react";
import { Wordmark } from "../../components/ui/Wordmark";
import { routes } from "../../lib/routes";

// The featured live match a cold user lands on for their first trade (VERIFY: onboarding → first trade < 60s).
const TONIGHT = { matchId: "wc26-can-mar", label: "Canada vs Morocco", meta: "LIVE · 74′ · Round of 16" };
const WALLET = "9pXk…devnetOMNI"; // invisibly provisioned embedded wallet (display form)
const validEmail = (e: string): boolean => /.+@.+\..+/.test(e.trim());

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [claimed, setClaimed] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center px-4 sm:px-6"><Wordmark tag="WC26" /></div>
      </header>

      <main className="grid flex-1 place-items-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          {/* progress */}
          <div className="mb-6 flex items-center justify-center gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === step ? "w-6 bg-up" : i < step ? "w-6 bg-up/40" : "w-6 bg-hairline"}`} />
            ))}
          </div>

          <div className="elev rounded-card border border-hairline bg-surface p-6">
            {step === 0 && (
              <div>
                <h1 className="font-display text-heading font-bold tracking-tight text-hi">Trade the match, live.</h1>
                <p className="mt-1.5 text-body leading-relaxed text-lo">Free to play. 1,000 credits on us — no card, no deposit, ever.</p>
                <label className="mt-5 block">
                  <span className="text-label font-medium uppercase tracking-tag text-lo">Email</span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 h-11 w-full rounded-chip bg-bg/60 px-4 text-body text-hi placeholder:text-lo ring-1 ring-inset ring-hairline transition-shadow duration-200 focus:outline-none focus:shadow-[0_0_0_2px_var(--up)]"
                  />
                </label>
                <button
                  type="button"
                  disabled={!validEmail(email)}
                  onClick={() => setStep(1)}
                  className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-chip bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-chain/10 ring-1 ring-inset ring-chain/40">
                  <Wallet className="h-5 w-5 text-chain" aria-hidden strokeWidth={2} />
                </div>
                <h1 className="mt-4 font-display text-heading font-bold tracking-tight text-hi">Your wallet is ready.</h1>
                <p className="mt-1.5 text-body leading-relaxed text-lo">We created a Solana wallet for you invisibly — no seed phrase, no extension. It&#39;s how your settlements get proved on-chain.</p>
                <div className="mt-4 flex items-center justify-between rounded-card border border-hairline bg-bg/40 px-4 py-3">
                  <span className="text-caption text-lo">Devnet wallet</span>
                  <span className="num text-caption tabular-nums text-chain">{WALLET}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-chip bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80"
                >
                  Continue <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="font-display text-heading font-bold tracking-tight text-hi">Claim your credits.</h1>
                <p className="mt-1.5 text-body leading-relaxed text-lo">1,000 credits, play money. You trade a live probability and settle at 100 credits if you&#39;re right.</p>

                <div className="mt-5 grid place-items-center rounded-card border border-hairline bg-bg/40 py-6">
                  <span className="num font-display text-display font-bold tabular-nums text-up">1,000</span>
                  <span className="text-label font-medium uppercase tracking-label text-lo">credits</span>
                </div>

                {!claimed ? (
                  <button
                    type="button"
                    onClick={() => setClaimed(true)}
                    className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-chip bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80"
                  >
                    Claim 1,000 credits
                  </button>
                ) : (
                  <div className="mt-4">
                    <div className="mb-3 inline-flex items-center gap-2 text-caption font-medium text-up">
                      <Check className="h-4 w-4" aria-hidden strokeWidth={2.5} /> Credits added to your balance.
                    </div>
                    <Link
                      href={routes.match(TONIGHT.matchId)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-chip bg-up px-4 text-strong font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:opacity-90 active:opacity-80"
                    >
                      Trade {TONIGHT.label} <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
                    </Link>
                    <p className="mt-2 text-center text-label uppercase tracking-wide text-lo">{TONIGHT.meta}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-label text-lo">Credits are play money and have no cash value.</p>
        </div>
      </main>
    </div>
  );
}
