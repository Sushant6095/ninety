"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "../../components/ui/Wordmark";
import { routes } from "../../lib/routes";

/** The landing's sticky marketing nav (structure only from the notio reference: logo left, links +
 *  CTA right). Transparent while the hero owns the top of the page; past ~8px of scroll it turns
 *  solid bg-bg/95 with a hairline bottom border so links stay legible over every chapter. The CTA
 *  is THE terminal button (B1) — same label as the hero + close, the one filled element on screen. */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
        scrolled ? "border-hairline bg-bg/95" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-3.5 sm:px-6">
        <Wordmark tag="WC26" />
        <nav aria-label="Landing" className="flex items-center gap-2">
          <Link
            href={routes.howItWorks}
            className="inline-flex min-h-11 items-center rounded-chip px-3 text-body font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-up/60 active:opacity-70"
          >
            How it works
          </Link>
          {/* The in-app written reference (docs moved in-house). /how-it-works stays the visual explainer;
              the GitBook link is a footer reference now. */}
          <Link
            href={routes.docs}
            className="hidden min-h-11 items-center rounded-chip px-3 text-body font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-up/60 active:opacity-70 sm:inline-flex"
          >
            Docs
          </Link>
          <Link
            href={routes.terminal}
            className="inline-flex h-11 items-center gap-1.5 rounded-chip bg-up px-4 text-body font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:opacity-80"
          >
            Open the terminal <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
