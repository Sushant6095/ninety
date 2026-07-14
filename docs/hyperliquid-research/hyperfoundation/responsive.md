# hyperfoundation.org — Responsive

## Breakpoints (Chakra)
```
base 0 · sm 320 · md 768 · lg 960 · xl 1200 · 2xl 1500 · 3xl 1600
```
Content is capped at **1200px** and centered; above that, extra width becomes margin (the narrative
column never stretches). The primary layout shift is at **md 768**.

## Desktop (≥ lg 960 / xl 1200)
- Floating 1200px pill nav with full link set + Launch App.
- Hero: large centered serif headline, dual CTAs side by side, full blob background.
- Feature blocks: 4 across.
- Diagram: full-width, all blocks + arrows visible, scrubbed on scroll.
- Stats band: 4 tiles across.

## Tablet (md 768 → lg 960)
- Nav likely still a bar but tighter; link set may begin to condense.
- Feature blocks: **2×2**.
- Diagram: scales down; may simplify arrows or allow horizontal room; text reflows.
- Stats: 2×2 or 4-across depending on width.

## Mobile (< md 768)
- **Nav collapses** to logo + hamburger/menu + (often) Launch App; text links move into a sheet.
- Hero: headline steps down in size (serif remains, ~fluid clamp), CTAs **stack full-width**.
- Feature blocks: **single column**.
- Diagram: the heaviest responsive challenge — it becomes a **vertical stack** of the concept
  (blocks stacked, arrows simplified/removed), or a simplified illustration; the scrubbed animation
  is reduced.
- Stats: single column or 2×2, numbers scale down but stay mono/tabular.
- CTAs and footer stack vertically.

## Fluid type
Headlines use large sizes that should be **clamped** (`clamp(...)`) so the serif scales smoothly
90px→~40px rather than snapping per breakpoint. Body stays 14–18px.

## Motion on mobile
The pinned scrollytelling + morph is expensive on phones; expect it to be **reduced or disabled** on
small/touch/reduced-motion, replaced by static hero art. Count-ups likely retained (cheap).

## Overflow discipline
- The blob background is full-bleed and clipped; no horizontal page scroll.
- The diagram must not force horizontal scroll — it collapses to a vertical concept on mobile.

## Takeaways for Ninety
1. **Cap the narrative column (~1200px)**; don't stretch text to ultrawide.
2. **Fluid-clamp the serif headline** for smooth scaling.
3. **Have a mobile fallback for the signature viz** (River): a static or lightweight version when the
   pinned/scrubbed animation is too heavy or reduced-motion is set.
4. Stack CTAs full-width on mobile; collapse nav to logo + menu + one CTA.
