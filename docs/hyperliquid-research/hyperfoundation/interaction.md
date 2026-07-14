# hyperfoundation.org — Interaction

## Scroll interaction (the core model)
- **Scroll-jacked / pinned narrative.** `document.body` is the scroll container (not `window`);
  `window.scrollTo` is a no-op. The hero is **pinned** — a large portion of scroll distance is
  "spent" animating in place (logo morph, blob drift) before the page advances. This makes scrolling
  feel like scrubbing a timeline.
- **Section reveals** trigger on enter (fade + rise). The diagram section scrubs its build to scroll
  progress.
- **No scroll-snap** observed; motion is continuous/scrubbed rather than snapping to sections.
- Implication: normal deep-linking to a mid-page anchor must *set the scroll progress*, not just jump
  Y — a rebuild needs to account for the pinned range.

## Pointer interaction
- **Nav links / CTAs:** hover (color/opacity/fill shift ~150ms), focus-visible ring, active press.
- **Diagram blocks:** likely hover/focus highlight per node (vaults/perps/oracles…), possibly a
  tooltip or emphasis; the diagram is the one "explorable" element.
- **Logo:** the mark is animated by scroll, not hover.
- Otherwise the page is **read-only** — it's a pitch, so interactivity is deliberately minimal
  (fewer things to fiddle with = more focus on the message + CTA).

## Wallet / app entry
- CTAs (**Start Trading / Launch App**) hand off to the app (`app.hyperliquid.xyz`). The connect flow
  itself lives in the app and uses **Privy + WalletConnect** (tokens present on this page: the connect
  UI is prefetched/embedded). The landing page's job ends at the handoff.

## Loading / empty / error states
- **Loading:** fonts (Teodor) + the blob/diagram assets are the heaviest; expect a brief
  hero-first paint with the display font swapping in, then scroll assets hydrate. Reserve space to
  avoid CLS on the serif headline.
- **Empty/error:** minimal surface area — the main runtime risk is the live **stats band** (if the
  metrics fetch fails, it should fall back to last-known or hide gracefully, not show 0/NaN).

## Keyboard & focus
- Links/buttons are keyboard-reachable with visible focus (Chakra defaults). The **pinned scroll**
  and **per-letter reveals** are the accessibility watch-items: keyboard/scroll users and reduced-
  motion users must still reach every section and read every word (keep an sr-only full-word copy
  behind letter animations; make the pin skippable).

## Interaction takeaways for Ninety
1. A **pinned signature hero** is worth it for a landing page — but make it *skippable* and
   reduced-motion-safe, and don't scroll-jack the actual app (only the marketing page).
2. **Keep the landing read-only** except the CTAs and the one explorable diagram — focus beats
   fiddliness for a pitch.
3. **Guard the live-stats fetch** with a graceful fallback; never render NaN/0 as "proof."
4. Hand off to the app cleanly; keep the connect flow (Privy/WalletConnect-style) in the app, not
   the landing.
