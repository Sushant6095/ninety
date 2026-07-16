import Link from "next/link";
import { Check } from "lucide-react";
import { routes } from "../../lib/routes";

const INCLUDED = [
  "1,000 credits, fresh every match",
  "Live prices across all 104 fixtures",
  "The Booth on every swing",
  "Settlement proven on Solana devnet",
] as const;

/** The pricing chapter — notio's pricing slot, inverted by the play-money law. Tiers exist to sell
 *  an upgrade; play money has nothing to sell, so the section IS one card and the single price is
 *  free. The card keeps a pricing panel's anatomy (price, included list, one CTA) so the structure
 *  reads instantly — the content is the argument. CTA label matches CtaPair's secondary verbatim;
 *  the filled treatment stays reserved for "Open the terminal" (one-filled-CTA law). */
export function FreeCredits() {
  return (
    <section aria-labelledby="free-h" className="border-b border-hairline">
      <div data-arrive className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-[600px] text-center">
          <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
            Pricing
          </p>
          <h2 data-arrive-item id="free-h" className="mt-4 font-display text-section font-bold text-hi">
            One price: free.
          </h2>
          <p data-arrive-item className="mx-auto mt-4 max-w-[52ch] text-strong leading-relaxed text-lo">
            Tiers exist to sell you an upgrade. Play money has nothing to sell — every match starts
            you with the same 1,000 credits as everyone else.
          </p>
        </div>
        <div
          data-arrive-item
          className="mx-auto mt-10 w-full max-w-[420px] rounded-card bg-surface p-8 ring-1 ring-inset ring-hairline"
        >
          <p className="num text-stat font-bold text-hi">Free</p>
          <p className="mt-2 text-strong font-medium text-hi">1,000 credits, every match</p>
          <p className="mt-1 text-body text-lo">No deposits. No cash value. Ever.</p>
          <ul className="mt-6 space-y-3">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-body leading-relaxed text-lo">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-up" aria-hidden strokeWidth={2.5} />
                {line}
              </li>
            ))}
          </ul>
          <Link
            href={routes.onboarding}
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-chip bg-bg px-5 text-strong font-medium text-hi ring-1 ring-inset ring-up/40 outline-none transition-colors duration-200 hover:ring-up focus-visible:ring-2 focus-visible:ring-up active:bg-hairline/40"
          >
            Get 1,000 credits
          </Link>
          <p className="mt-4 text-center text-label uppercase tracking-caps text-lo">
            There is no second tier.
          </p>
        </div>
      </div>
    </section>
  );
}
