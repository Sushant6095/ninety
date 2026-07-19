# ADR-085 — Landing finale: a layered football crest-parallax closing on the NINETY wordmark

**Status:** Accepted · **Date:** 2026-07-19 · **Follows:** ADR-069 (long football-first landing), ADR-058
(dynamism sanctioned on the landing, banned on live-price surfaces), ADR-055 (baked local assets, no runtime CDN),
ADR-077 (light + dark themes). · **Owns:** `apps/web/src/features/landing/LandingFinale.tsx` +
`LandingFinaleLazy.tsx`, the `pfinDrift` / `.pfin-track` rules in `globals.css`, and the finale slot in
`LandingLong.tsx` (section 9, after the scroll story, before the footer).

## Context
The landing needed a closing statement. The 21st.dev `mountain-vista-bg` component was the **technique** reference
(background planes layered at different speeds/sizes/z-indexes). Four things about that component were wrong for us
and had to change before anything shipped.

## Decisions

1. **Subject swap: mountains + cyclists → football, from OUR assets.** A mountain-biking scene at the bottom of a
   World Cup trading site is exactly the off-theme decoration the parallel loop is deleting. Kept the layering
   technique; the drifting subject is the **48 national crests** (`public/teams/{id}/badge.png`) — the football
   equivalent of the component's moving bikes, and ours.

2. **No third-party CDN.** The source hotlinks another author's CodePen assets from `s3-us-west-2.amazonaws.com` /
   `cdpn.io`. ADR-055 forbids runtime asset CDNs; every image here is a local `/public` crest. Verified: the built
   output contains **zero** `cdpn.io` / `amazonaws` URLs.

3. **Complete, correct CSS.** The pasted snippet defined only two `@keyframes` and would not animate. We wrote the
   full rule set as `pfinDrift` + `.pfin-track` in `globals.css`.

4. **Performance: transform, not `background-position`.** The source animates `background-position`, which repaints
   every frame and is not GPU-composited — eight full-width layers of that would regress our FCP / no-long-tasks
   budget. Instead each drifting layer is a `.pfin-track` holding **two identical tile sets** and animating
   `transform: translate3d(-50%,0,0)` with `will-change: transform` (compositor-only, seamless loop). Verified: the
   drift frames differ across time (motion is real) with no repeated long tasks on the settled scene.

## The stadium-plane deviation (flagged, per the anti-slop / anti-borrowed-art laws)
The plan's suggested composition included a darkened `stadium.jpg` skyline plane ("47 real stadium photographs").
On LOOKING at the actual files, they are **not stadiums** — they are a grab-bag of fan-crowd shots, team squad
photos, full country flags, and a third-party **"France — WINNER OF WORLD CUP 2018"** promo poster. Compositing
those (even blurred) would ship off-theme imagery of dubious provenance — precisely the borrowed art STEP 0b bans.
So the stadium plane was **dropped**; the parallax depth comes from **two crest planes** instead (a big, dim, slow
far plane + a nearer, faster band, reversed against each other), plus a token floodlight glow and a foreground pitch
touchline. This is the one deviation from the suggested composition, made to honor the honesty/anti-slop laws over a
"suggested" layer built on bad assets.

## Motion, theme, and lazy-mount
- **Theme (ADR-077):** every image plane sits under a `bg`-token scrim, so the scene tints toward the theme
  background — dark in dark, light in light — and the wordmark's `text-hi` stays legible in both. The finale never
  flips theme mid-page. Verified in both themes (near-white NINETY on dark; near-black NINETY on light).
- **Reduced motion:** `.pfin-track`'s animation is gated to `@media (prefers-reduced-motion: no-preference)`, so
  under `reduce` the scene renders **fully static** (no drift at all). Verified: reduced-motion frames are
  byte-identical.
- **Lazy-mount (never costs FCP):** `LandingFinaleLazy` is `next/dynamic` `ssr:false` (like FlowFieldLazy /
  WorldGlobeLazy) with a full-height placeholder; the mounted component then IO-gates its own crest decode
  (`rootMargin: 300px`), so the 192 crest tiles load only as the section nears the viewport.
- **Landing only (ADR-058):** the finale lives at the bottom of `/` and is never rendered on `/terminal`, `/board`,
  or any live-price surface.

## Copy
Wordmark **NINETY**; one honest line — "Every World Cup match, priced live. Play money, proven on-chain." — and the
landing's single locked funnel (`CtaPair`: "Open the terminal" / "Get 1,000 credits"). No filler paragraph, no
em-dash, play-money only.

## Verification
Clean prod build (`rm -rf .next` → one build → `next start`). A temporary `finale-preview` route rendered the finale
in isolation for a styled screenshot pass (deleted before ship; absent from the final build). Looked at lg + xl in
both themes and captured motion frames: the wordmark reads, the two crest planes drift at different speeds, the
reduced-motion capture is static, and the built output has zero external image URLs and zero raw hex.
