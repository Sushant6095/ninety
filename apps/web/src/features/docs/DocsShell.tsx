"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { Wordmark } from "../../components/ui/Wordmark";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { routes, DOCS_URL } from "../../lib/routes";
import { DOCS_PAGES, docsNeighbours } from "./docsNav";

/** The /docs frame (ADR: docs in-house). A reading shell, deliberately unlike the trading chrome:
 *  a calm sticky top bar, a persistent left contents rail, a generous reading column, and prev/next
 *  at the foot. No ticker, no live price — this is a page you read, not trade. Both themes, tokens only. */
export function DocsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/docs";
  const { prev, next } = docsNeighbours(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Wordmark tag="DOCS" />
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={routes.board}
              className="inline-flex h-9 items-center gap-1.5 rounded-chip px-3 text-caption font-medium text-lo outline-none transition-colors duration-200 hover:bg-surface hover:text-hi focus-visible:ring-2 focus-visible:ring-up/60"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden strokeWidth={2} /> Back to app
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1180px] flex-1 gap-10 px-4 sm:px-6">
        {/* Contents rail */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="Docs" className="sticky top-20 py-10">
            <p className="mb-3 px-3 text-label font-semibold uppercase tracking-label text-lo">Contents</p>
            <ul className="flex flex-col gap-0.5">
              {DOCS_PAGES.map((p) => {
                const active = pathname === p.href;
                return (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-chip px-3 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-up/60 ${
                        active ? "bg-surface text-hi ring-1 ring-inset ring-hairline" : "text-lo hover:bg-surface/60 hover:text-hi"
                      }`}
                    >
                      <span className="block text-body font-medium">{p.label}</span>
                      <span className="mt-0.5 block text-label leading-snug text-lo">{p.blurb}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1 px-3 text-label text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi"
            >
              GitBook reference <ArrowUpRight className="h-3 w-3" aria-hidden strokeWidth={2} />
            </a>
          </nav>
        </aside>

        {/* Mobile contents (horizontal) */}
        <div className="min-w-0 flex-1 py-8 lg:py-10">
          <nav aria-label="Docs" className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {DOCS_PAGES.map((p) => {
              const active = pathname === p.href;
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-chip px-3 py-1.5 text-caption font-medium outline-none ring-1 ring-inset transition-colors duration-200 focus-visible:ring-up ${
                    active ? "bg-surface text-hi ring-hairline" : "text-lo ring-hairline/60 hover:text-hi"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </nav>

          <main>{children}</main>

          {/* Prev / next */}
          <nav aria-label="Page navigation" className="mt-16 grid gap-3 border-t border-hairline pt-6 sm:grid-cols-2">
            {prev ? (
              <Link
                href={prev.href}
                className="group flex flex-col rounded-card border border-hairline bg-surface px-4 py-3 outline-none transition-colors duration-200 hover:border-hairline hover:bg-hairline/15 focus-visible:ring-2 focus-visible:ring-up/60"
              >
                <span className="inline-flex items-center gap-1 text-label uppercase tracking-label text-lo">
                  <ArrowLeft className="h-3 w-3" aria-hidden strokeWidth={2} /> Previous
                </span>
                <span className="mt-1 text-body font-medium text-hi">{prev.label}</span>
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {next ? (
              <Link
                href={next.href}
                className="group flex flex-col rounded-card border border-hairline bg-surface px-4 py-3 text-right outline-none transition-colors duration-200 hover:border-hairline hover:bg-hairline/15 focus-visible:ring-2 focus-visible:ring-up/60"
              >
                <span className="inline-flex items-center justify-end gap-1 text-label uppercase tracking-label text-lo">
                  Next <ArrowRight className="h-3 w-3" aria-hidden strokeWidth={2} />
                </span>
                <span className="mt-1 text-body font-medium text-hi">{next.label}</span>
              </Link>
            ) : (
              <span aria-hidden />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
