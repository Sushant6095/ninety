# design-cop verdict — "The icons" hover-expand gallery (landing)

- **Date:** 2026-07-18 · Branch: `merge/live-integration`
- **Surface:** `apps/web/src/features/landing/IconsGallery.tsx` on `apps/web/src/components/vendor/skiper/skiper52.tsx` (`HoverExpandGallery`)
- **Placement:** `LandingLong.tsx`, between `<BoothQuotes />` and the 48-crest "whole tournament" wall.
- **Shots looked at:** `/tmp/icons-shots/icons-{xl,lg}-{rest,hover}.png` (light theme).
- **Scope:** `pnpm dlx shadcn add @skiper-ui/skiper52` component pull + re-skin, landing-only, not a live-price surface.

> Persisted by the parent agent, from the design-cop subagent (read-only).

## Verdict: **PASS-WITH-NOTES**

Clears every hard gate (rubric 1–9, 11, 12 PASS; 10 PASS). Not a clean PASS only because of the sanctioned-but-real flex-grow layout-animation tension and one copy nit (now fixed).

## Rubric (12 lines)
1 HIERARCHY PASS (one focal panel; scale ladder label→section→strong→gallery) · 2 TOKENS PASS (no raw hex; scrim = `color-mix(var(--bg))`; numbers `.num`) · 3 RESTRAINT PASS (N/A — landing interlude) · 4 BLEND PASS · 5 MOTION PASS *(documented LAW TENSION — `transition-[flex-grow]` is a layout prop; accepted: component essence, one row, 250ms, landing-only off the tick path, PRM → instant state)* · 6 STATES PASS (hover/focus-visible/active; lazy stills) · 7 A11Y PASS (focus ring, `text-lo` ≈4.8:1 in light, keyboard/touch parity via focus-within, name-free descriptive alt) · 8 COPY PASS (no bet/stake/odds/wager; "live markets") · 9 CONSISTENCY PASS (shared nav/max-w/`data-arrive`, canonical token card) · 10 ELEVATION PASS (token-pinned dual-theme football narrative bridging BoothQuotes → crest wall; swiper baggage removed, focus+PRM+scrim added) · 11 FEELING PASS (point at a legend, the panel sweeps open) · 12 PROVENANCE PASS (row at PROVENANCE.md).

## Read-out-loud (clean, no contradiction)
Nav "Ninety · WC26 · How it works · Docs · [theme] · Open the terminal →" · eyebrow "THE ICONS" · h2 "The shirts that move a nation." · sub "…forty-eight of those shirts are live markets — hover a shirt to bring it forward." · active caption "FRANCE · 10" (hover shot expands `05-zidane.jpg` → France #10, correct).

## Notes / gaps (severity-ordered)
1. **[MEDIUM · motion]** `transition-[flex-grow]` animates a layout property — accepted under the landing-only exemption, documented in the component's LAW TENSION comment. **Must never migrate to `/terminal`, board, or any tick-path surface.**
2. **[MEDIUM · copy] → FIXED.** Sub read "hover a **name**" while captions are deliberately name-free → changed to "hover a **shirt** to bring it forward."
3. **[LOW · curation]** Two Haaland panels, both "Norway · 9" — reads placeholder-ish; replace one when licensed art lands.
4. **[LOW · caption]** Zlatan caption "Milan" is a club (not nation·number; Sweden isn't in WC26) — swap to a nation icon or adjust when art lands.
5. **[LOW · elevation]** Panels show no market signal though copy says "live markets" — optional future lift: a token PriceChip on the expanded caption.
6. **[LOW · a11y]** `tabIndex={0}` on non-actionable `<article>` — a focus stop with no role; acceptable for a reveal.
7. **[LOW · states]** No broken-image fallback on `<img>` — low risk (owned static assets).

## ⚠ LEGAL FLAG (hard gate on PUBLIC ship — NOT on the mechanism)
The 7 stills are third-party broadcast / wallpaper likenesses of named players carrying club, sponsor and FIFA marks — a **MECHANISM PLACEHOLDER**, same class as the scroll-scrub clip. Documented in `design/PROVENANCE.md` and the `IconsGallery.tsx` header. **Swap for owned / licensed / anonymous art before any public deploy.** The component is asset-agnostic (pure prop swap).

**Bottom line: PASS-WITH-NOTES.** The one actionable copy note is fixed; the remaining notes are the documented flex-grow exemption plus curation items that resolve with the pre-public-ship asset swap.
