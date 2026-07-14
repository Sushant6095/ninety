# hyperfoundation.org — Screenshot Catalog

> Tooling note: screenshots were captured live via the Chrome extension for analysis, but this
> environment did not expose a writable path to persist the image binaries into this folder (the
> Playwright fallback's browser profile was locked). Rather than ship empty files, this catalog
> records each captured frame with a precise visual description + the observed state, so the visual
> hierarchy is fully reconstructable alongside `../../html/home.html` and the Figma spec in
> `layout.md`. Re-run with a browser whose screenshot path is writable to populate real PNGs.

## Captured frames

| # | Frame | What it shows |
|---|---|---|
| 01 | **Hero (state A)** | White pill nav (logo · Stats/Docs/Ecosystem · mint "Launch App"). Centered mint bowtie mark. Teodor serif headline "The Blockchain To House All Finance" (~90px, white). Subcopy (3 lines, muted). Dual CTAs: filled-mint "Start Trading" + outline "Start Building". Dark-green gradient bg with soft organic 3D blobs, mint glow bottom-left. |
| 02 | **Hero (morph state B)** | Same hero, **logo mark morphed to a single rounded blob** — captured mid-scroll; demonstrates the pinned scroll-scrubbed logo morph. |
| 03 | **Hero (morph state C)** | Logo mark morphed back toward the bowtie/asymmetric form — the third morph keyframe. |
| 04 | **Flagship exchange** | "The premier DECENTRALISED exchange" with per-letter animated word; 4 feature blocks (Low fees · Up to 40x leverage · Transparent · Seamless). *[described from page copy + structure; not separately imaged due to pinned-scroll capture limits]* |
| 05 | **The Stack (SVG diagram)** | Interactive architecture diagram: labeled blocks vaults/perps/oracles/spot/governance/bridges/auctions, HyperCore↔HyperEVM, connective arrows; scrubbed build on scroll. *[structure confirmed via DOM `<g id>` inventory]* |
| 06 | **Stats band** | Four mono metric tiles: Block time 0.07s · Users 2,261,901 · Max TPS 200,000 · Daily volume $9.1B. *[from page copy]* |
| 07 | **Community / HYPE** | Teodor headline "Community first." (90px, dark-green ink on light) + "No investors. No paid market makers…" + HYPE ownership copy. |
| 08 | **Closing CTA + footer** | "Own a piece of Hyperliquid today" + dual CTAs; footer © 2025, legal links, social icons (TG/GitHub/Discord/X). |

## Colors sampled (verbatim from computed styles)
mint `#97FCE4` (accent) · greens `#0F3933 / #072723 / #23524C / #33998C / #02231E` · headline ink
`#072723` on light · text `rgba(255,255,255,0.92)` on dark · hairline `rgba(255,255,255,0.16)`.

## Type sampled
Headline: **Teodor, 90px, weight 400, line-height 1.0**. Nav/body: **Inter, 16px, weight 400**
(body copy 300/400). Stat numbers: system **mono**, tabular.
