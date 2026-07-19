# ADR-077 — Apple system font + a token-driven light/dark theme toggle

**Status:** Accepted · **Date:** 2026-07-18 · **Follows:** ADR-058 (dynamism / gradient scope), ADR-068 (notio shadcn bridge).
**Amends:** the Design law in CLAUDE.md — Type (was Archivo/Inter), "no light mode (v1)", and the palette note.

## Context
Owner request: switch the whole app to an Apple font, add a white/dark toggle, and make it more colourful (like
Sofascore). The token architecture already supported it: raw hex lives in `styles/tokens.css`, a shadcn bridge
maps semantics to those vars, and `tailwind.config.ts` maps colour keys to the vars via `color-mix` — so a
second theme is a `[data-theme]` override, not a per-component rewrite.

## Decisions

1. **Apple system font, no webfont.** Dropped the `next/font/google` Archivo/Inter/IBM Plex Mono. `globals.css`
   sets `--font-display`/`--font-ui` to `-apple-system, BlinkMacSystemFont, "SF Pro Display/Text", …` and
   `--font-mono` to `ui-monospace, "SF Mono", …`. On Apple platforms this is genuine San Francisco / SF Mono
   with zero fetch and no licence issue; numbers stay mono + tabular (design law) via the SF Mono stack.

2. **Light mode is a `[data-theme="light"]` token override.** `tokens.css` keeps `:root` = dark (default,
   no-JS safe) and adds `:root[data-theme="light"]` overriding the theme-dependent tokens: near-white
   bg/surface/hairline, near-black/grey text, soft tinted-grey elevation, and accents **re-tuned for contrast
   on white** (the dark-mode up-green/down-pink are too light to read on #FFF; light uses deeper `#0B9E5A` /
   `#E11D6B` / `#B26A00`, chain `#7C4DFF`). Elevation shadows moved to `--elev-1/2` vars so `.elev` themes too.
   The shadcn bridge references the raw vars, so it flips automatically.

3. **A no-flash theme script + a `ThemeToggle`.** An inline script in the root layout `<head>` sets
   `<html data-theme>` and the `dark` class before first paint, from `localStorage("ninety-theme")` then
   `prefers-color-scheme`, default dark. `ThemeToggle` (in the app header + the landing nav) flips all three in
   sync. Keeping the `dark` class synced with `data-theme` is what makes notio's `dark:` variants
   (`darkMode:"class"`) resolve for the active theme. `<html suppressHydrationWarning>` because the script
   mutates it pre-hydration.

4. **"Colourful like Sofascore" = the light theme + the real crests.** No new multi-hue palette was invented
   (that would be slop + a token-law fight). The bright white surface lets the 48 baked national crests/flags
   and the vivid accents carry the colour, exactly the Sofascore read. The disciplined semantic palette stands.

## Verification
Built on a fresh local prod build; both themes captured on `/board`, `/terminal`, `/moments`, `/leaderboard`,
and `/` (landing), lg + xl. All render with zero page errors. Every canvas (River panes, DribbleScene,
FlowField, PriceVoid) re-themes because it reads colours from the CSS vars via `resolveColor` — the landing's
"dark-only" canvas concern was unfounded; the full landing adapts to light. Toggle verified functional +
persisted (dark → light → dark, `data-theme` + `dark` class + localStorage in sync). Read-out-loud unchanged
(same components, re-themed): e.g. board CAN 61.4 across featured/row/mover in both modes.

## Deferred / notes
- Default stays **dark** (respects OS light). If the owner wants light as the default first impression, flip the
  script's fallback.
- Light-mode accent contrast was tuned by eye for AA-large on the bold tabular numbers; a formal per-accent
  WCAG audit in light is a follow-up if any small-text accent use is found wanting.
