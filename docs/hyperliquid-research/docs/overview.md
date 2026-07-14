# hyperliquid.gitbook.io/hyperliquid-docs — Full Analysis

> Consolidated doc (all eight facets). A **GitBook-hosted documentation site** — the reference model
> for Ninety's own docs / how-it-works reference. Dark theme, mint accent (Hyperliquid brand).

## Purpose · target user · actions
- **Purpose:** the canonical reference — what Hyperliquid is, how to onboard/trade, HyperCore/
  HyperEVM, HIPs, validators, risks, brand kit, and developer docs.
- **Target users:** two audiences via top tabs — **readers** (Hyperliquid Docs) and **developers**
  (Builder Tools) + **Support**.
- **Primary action:** find and read a topic. **Secondary:** search (⌘K), copy a page as markdown,
  jump via on-this-page anchors, switch section tab.

## Navigation (the GitBook 3-pane model)
- **Top bar:** logo "Hyperliquid Docs" · **section tabs** (Hyperliquid Docs · Builder Tools ·
  Support) · **Search… (⌘K)** far right.
- **Left sidebar — collapsible nav tree:** About Hyperliquid (▸ Hyperliquid 101 for non-crypto
  audiences) · Onboarding › · HyperCore › · HyperEVM › · HIPs › · Trading › · Validators › ·
  Referrals · Points · Historical data · Risks · Bug bounty program · Audits · **Brand kit** · a
  "FOR DEVELOPERS" group · "Powered by GitBook" badge pinned at the bottom.
- **Center:** breadcrumb → H1 → prose, with a **Copy** control (+ dropdown: copy page as Markdown /
  view as markdown — the modern "LLM-friendly docs" feature).
- **Right sidebar — "ON THIS PAGE":** anchor list (the page's headings) that **tracks scroll**
  (scroll-spy) and deep-links.
- IA: a **hierarchical tree** (2–3 levels, collapsible), grouped by domain, with two top-level
  audience tabs. Everything is one or two clicks + search.

## Layout & typography
- Three columns: nav (~260px) · content (centered, ~700–760px measure / ~65–70ch) · TOC (~220px).
- Dark surfaces, off-white body, **mint accent** for active nav + inline links + the left-rail active
  indicator (a mint left-border/underline).
- Comfortable prose: generous line-height, clear H1/H2/H3 hierarchy, sans typography, ample
  whitespace — optimized for reading, not density.

## Components
1. **Nav tree** — collapsible sections (chevrons), active item highlighted (mint), nested children,
   a pinned footer badge.
2. **Section tabs** (top) — switch doc spaces (Docs / Builder Tools / Support).
3. **Search (⌘K)** — modal command-palette search across all pages (fuzzy, keyboarded).
4. **On-this-page TOC** — scroll-spy anchor list; the active heading highlights as you scroll.
5. **Copy-as-markdown** — button + dropdown to copy/view the page as markdown (for LLMs/reuse).
6. **Prose blocks** — headings, paragraphs, lists, **code blocks** (with copy buttons), **callouts/
   hints** (info/warning boxes), **tabs** (e.g. language/OS variants), tables, images.
7. **Breadcrumb** — path to the current page.
8. **Anchor links** — hover a heading → a link affordance for deep-linking.
9. **Prev/Next page** footer links (bottom of content).

## Motion
Minimal, appropriate for docs: nav expand/collapse (~150–200ms), search modal fade+scale, smooth-
scroll to anchors, TOC active-item transition, copy-button "copied!" confirmation. No decorative
motion.

## Responsive
- Desktop: full 3-pane.
- Tablet: right TOC drops first; nav may collapse to a toggle.
- Mobile: **both sidebars collapse** — nav behind a hamburger/drawer, TOC into an inline "on this
  page" disclosure at the top; content full-width; search stays reachable. Code blocks scroll
  horizontally; tabs remain.

## Interaction
- **Search (⌘K)** → type → jump. **Nav tree** expand/collapse + select. **TOC** click → smooth-scroll
  + URL hash. **Copy** page/code. **Section tabs** switch spaces. **Prev/Next** to move sequentially.
- States: loading (fast, mostly static), empty search ("no results"), 404 page, external-link
  affordances.

## Performance
- **Static-first** (GitBook prerenders pages) → instant, SEO-strong, cacheable. Search is client-
  or edge-indexed. Only interactive bits (search modal, nav collapse, scroll-spy, copy) hydrate.
- Great model for our docs: SSG content, tiny JS, fast anchors.

## Takeaways for Ninety (our docs / how-it-works)
1. **Adopt the GitBook 3-pane pattern** for reference docs: collapsible domain nav · readable prose ·
   scroll-spy on-this-page TOC · ⌘K search.
2. **Two audience tabs** (Users / Builders) if we have both.
3. **Copy-as-markdown** is a modern, cheap win — makes our docs LLM- and reuse-friendly.
4. **Callouts, code blocks with copy, and tabs** are the core prose primitives to build.
5. **Static-first + ⌘K search**; readable measure (~65ch); mint accent on active nav/links to match
   our brand (for us, our own accent on a dark surface).
6. A dedicated **Brand kit** page is worth having (they do) — logos, colors, usage.
