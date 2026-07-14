# hyperfoundation.org — Layout & Design System

Built on **Chakra UI** — 496 design tokens read from the rendered `:root`. Below are the values that
matter for a rebuild (Figma-grade).

## Grid & widths
- **Content max-width: 1200px** (= Chakra `breakpoints-xl` / container-xl `1280px` capped ~1200).
  The nav pill is exactly 1200px wide, centered, with ~128px side margins at 1440.
- **Base unit: 4px.** Spacing scale is Chakra's `space-*`: `1=4 · 2=8 · 3=12 · 4=16 · 6=24 · 8=32 ·
  12=48 · 16=64 · 20=80 · 24=96 …` up to `96=384px`. → an **8pt grid** in practice (4px minor).
- Full-bleed backgrounds (hero gradient, section washes) span the viewport; **content is centered in
  the 1200px column.**

## Breakpoints (Chakra)
```
sm 320 · md 768 · lg 960 · xl 1200 · 2xl 1500 · 3xl 1600   (base 0)
```
The meaningful desktop→mobile pivot is **md 768** (see `responsive.md`).

## Type scale (Chakra `fontSizes`, rem)
```
2xs .625(10) · xs .75(12) · sm .875(14) · md 1(16) · lg 1.125(18) · xl 1.25(20)
· 2xl 1.5(24) · 3xl 1.875(30) · 4xl 2.25(36) · 5xl 3(48) · 6xl 3.75(60)
· 7xl 4.5(72) · 8xl 6(96) · 9xl 8(128)
```
Observed usage: **hero headline ≈ 90px Teodor/400/lh 1.0**; section headlines Teodor 90px (e.g.
"Community first."); body copy Inter, small (14–18px). Two font families only:
- `Teodor` — serif display (headlines only).
- `Inter` — everything else (nav, body, labels, buttons).
- system mono (`SFMono/Menlo`) — the big stat numbers (tabular).

## Weights
Text nodes use only **300 (light)** and **400 (normal)**. No bold headings — hierarchy comes from
**size + serif-vs-sans + color**, not weight. (Chakra exposes 100–900, but the design uses 300/400.)

## Color system — the brand ramp (the signature)
```
brand-50  #F6FEFD   near-white mint
brand-100 #DBFBF6
brand-200 #97FCE4   ← MINT ACCENT (primary CTA fill, logo, highlights)
brand-300 #50D2C1   teal
brand-400 #33998C
brand-500 #23524C
brand-600 #17453F
brand-700 #0F3933   hero mid-green
brand-800 #072723   deep green (headline ink on light)
brand-900 #02231E   near-black green (darkest bg)
```
The **entire page is this one ramp** + white + alpha-white overlays (`whiteAlpha-*`). Confirmed by
the dominant colors: mint `#97FCE4`, greens `#0F3933 / #072723 / #23524C / #33998C`. Chakra's full
default palette (blue/red/etc.) is present in tokens but **unused** — a lesson in shipping a
monochrome brand on top of a generic token set.
- Text: `whiteAlpha-900` (rgba(255,255,255,.92)) on dark; `brand-800/900` on light.
- Borders/hairlines: `whiteAlpha-300` (rgba(255,255,255,.16)) — the most-used color on the page.

## Radii
```
base 4 · md 6 · lg 8 · xl 12 · 2xl 16 · 3xl 24 · full 9999
```
Nav pill & CTAs use **full/≈37px** (pill). Cards/feature blocks use `xl–2xl` (12–16). Privy modal
uses its own `--privy-border-radius` (sm 6 · md 12 · lg 24 · full).

## Elevation / shadows
Chakra defaults (`sm → 2xl`, low-opacity black). On the dark page, depth comes mostly from
**gradient washes + blur + the mint glow**, not drop shadows. `--chakra-blur-*` (4–64px) powers the
soft blurred blobs and glassy nav.

## Sticky offsets / z-index (Chakra `zIndices`)
```
hide -1 · base 0 · docked 10 · dropdown 1000 · sticky 1100 · banner 1200
· overlay 1300 · modal 1400 · popover 1500 · skipLink 1600 · toast 1700 · tooltip 1800
```
A named stacking contract (same discipline we adopt for Ninety). The wallet modals (Privy/WCM) use
their own very-high indices (`--wcm-z-index: 1000000`).

## Section heights (estimated, at 1440×900)
- Hero: ~1 viewport, **pinned** across a multi-viewport scroll range (the morph consumes scroll).
- Flagship exchange + 4 feature blocks: ~1–1.5 viewports.
- The Stack (SVG diagram): tall, ~2 viewports of pinned/scrubbed reveal.
- Stats band: ~0.7 viewport.
- Community/HYPE + closing CTA: ~1.2 viewports.
- Footer: ~0.4 viewport.
- **Total document height ≈ 8915px** (long-form scroll narrative).

## Figma-grade summary
```
Max content width:   1200px (side margin ~128px @1440)
Grid:                8pt (4px base)
Nav:                 pill, 1200×56, radius 37, bg #FFF, pad 8/8/8/16, y-offset 20
Display type:        Teodor serif, ~90px, weight 400, line-height 1.0
Body type:           Inter, 14–18px, weight 300/400
Accent:              #97FCE4 (mint), spent only on primary CTA + logo
Surfaces:            brand-700/800/900 greens; light sections near-white
Radius:              pill (CTA/nav), 12–16 (cards)
Shadow:              minimal; depth via gradient + blur glow
Motion:              50–500ms Chakra scale; ease-out cubic-bezier(0,0,0.2,1)
```
