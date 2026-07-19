// The four docs pages, in reading order. Drives the sidebar, the prev/next foot, and active state.
// One source — add a page here and the whole shell (sidebar + prev/next) picks it up.
export interface DocsPage {
  href: string;
  label: string; // sidebar + prev/next label
  blurb: string; // one-line sidebar sub-label
}

export const DOCS_PAGES: readonly DocsPage[] = [
  { href: "/docs", label: "Overview", blurb: "What Ninety is, and what's live" },
  { href: "/docs/architecture", label: "Architecture", blurb: "How it's built" },
  { href: "/docs/roadmap", label: "Future plans", blurb: "Where it goes next" },
  { href: "/docs/about", label: "About", blurb: "Who built it, and why" },
] as const;

/** Prev / next neighbours for a given docs path (null at the ends). */
export function docsNeighbours(pathname: string): { prev: DocsPage | null; next: DocsPage | null; index: number } {
  const i = DOCS_PAGES.findIndex((p) => p.href === pathname);
  if (i === -1) return { prev: null, next: null, index: -1 };
  return { prev: i > 0 ? DOCS_PAGES[i - 1] : null, next: i < DOCS_PAGES.length - 1 ? DOCS_PAGES[i + 1] : null, index: i };
}
