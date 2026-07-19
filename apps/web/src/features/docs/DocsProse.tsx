import type { ReactNode } from "react";

/** Reading-page primitives for /docs. Comfortable measure (65–75ch), generous leading, real anchor
 *  links on every heading (judges deep-link). Colours are tokens only; both themes read from them. */

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

/** The page title (h1). Big, tight, display. */
export function DocTitle({ children, eyebrow }: { children: string; eyebrow?: string }) {
  return (
    <header className="mb-8 max-w-[42ch]">
      {eyebrow ? (
        <p className="mb-2 text-label font-semibold uppercase tracking-label text-up">{eyebrow}</p>
      ) : null}
      <h1 className="font-display text-display font-bold leading-tight tracking-tight text-hi">{children}</h1>
    </header>
  );
}

/** A section heading with a real, hover-revealed anchor link. `id` derives from the text. */
export function H2({ children }: { children: string }) {
  const id = slug(children);
  return (
    <h2 id={id} className="group scroll-mt-24 mt-14 mb-3 flex items-center gap-2 font-display text-heading font-bold tracking-tight text-hi">
      <a
        href={`#${id}`}
        aria-label={`Link to ${children}`}
        className="-ml-5 shrink-0 text-up opacity-0 outline-none transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-up/60"
      >
        #
      </a>
      <span>{children}</span>
    </h2>
  );
}

/** A comfortable reading paragraph. */
export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-[70ch] text-[1.0625rem] leading-[1.75] text-lo [&_strong]:font-semibold [&_strong]:text-hi [&_em]:not-italic [&_em]:text-hi">{children}</p>;
}

/** The one lead paragraph under a title — larger, brighter. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-[65ch] text-[1.25rem] font-medium leading-[1.6] text-hi [&_em]:not-italic [&_em]:text-up">{children}</p>;
}

/** A bordered callout. `tone` picks the accent border: halt (warning/status), chain (on-chain), or default. */
export function Callout({ tone = "default", title, children }: { tone?: "halt" | "chain" | "default"; title?: string; children: ReactNode }) {
  const border = tone === "halt" ? "border-halt/70" : tone === "chain" ? "border-chain/60" : "border-hairline";
  const dot = tone === "halt" ? "bg-halt" : tone === "chain" ? "bg-chain" : "bg-lo";
  const titleColor = tone === "halt" ? "text-halt" : tone === "chain" ? "text-chain" : "text-hi";
  return (
    <aside className={`mt-8 max-w-[72ch] rounded-card border ${border} bg-surface px-5 py-4`}>
      {title ? (
        <p className={`mb-1.5 flex items-center gap-2 text-label font-semibold uppercase tracking-label ${titleColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden /> {title}
        </p>
      ) : null}
      <div className="text-body leading-[1.7] text-lo [&_strong]:font-semibold [&_strong]:text-hi">{children}</div>
    </aside>
  );
}

/** A mono code line/block (settlement flag, endpoints), tokenised, optional accent border. */
export function Code({ tone = "default", children }: { tone?: "halt" | "chain" | "default"; children: ReactNode }) {
  const border = tone === "halt" ? "border-halt/70" : tone === "chain" ? "border-chain/60" : "border-hairline";
  return (
    <pre className={`num mt-6 max-w-[72ch] overflow-x-auto rounded-card border ${border} bg-surface px-4 py-3.5 text-caption leading-relaxed text-hi`}>
      <code>{children}</code>
    </pre>
  );
}
