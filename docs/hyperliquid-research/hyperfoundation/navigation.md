# hyperfoundation.org — Navigation

## Global nav (the floating pill)
A single **white pill bar**, 1200×56px, radius 37px, sitting 20px from the top, centered. Contents:

```
[● Hyperliquid wordmark]                 Stats   Docs   Ecosystem   [ Launch App ]
   logo mark + "Hyper" + italic "liquid"                            mint pill button
```

- **Left:** the logo — a mint/black "bowtie/hourglass" mark + wordmark where "Hyper" is regular and
  "*liquid*" is **italic** (a small, memorable typographic signature). Links to `/`.
- **Right cluster:** three text links (Inter 16/400) + one filled mint pill CTA.
  - **Stats** → live metrics (stats band / stats surface).
  - **Docs** → `hyperliquid.gitbook.io/hyperliquid-docs`.
  - **Ecosystem** → `.../hyperliquid-docs/hyperevm`.
  - **Launch App** → the trading app.
- **Behavior:** computed `position: static`, but it lives inside the **pinned hero**, so it reads as
  fixed/persistent through the hero range, then scrolls with the page. Effect: always-available at
  the top of the experience where the primary funnel matters.
- **Contrast trick:** a *white* pill floats on the *dark green* hero — high contrast, unmistakable,
  and it doubles as the page's brightest surface, drawing the eye to the CTA.

## Information architecture (this page is a funnel, not a tree)
There is **no deep nav tree** — the landing page is a linear narrative with two exits:
```
hyperfoundation.org (thesis → proof → architecture → stats → community → CTA)
        ├── Start Trading / Launch App      → app.hyperliquid.xyz/trade   (users)
        ├── Start Building                   → docs / builder path         (devs)
        ├── Docs                             → GitBook                     (reference)
        ├── Ecosystem                        → GitBook / HyperEVM
        └── Footer → socials + legal
```
Everything on the page pushes toward **one of two CTAs**. That single-mindedness is the point.

## Footer nav
- **Legal:** Terms of Service · Privacy Policy · Genesis Event Terms & Conditions · NFT Terms &
  License (all on `hyperfoundation.org/...`).
- **Social:** Telegram (`t.me/hyperliquid_announcements`) · GitHub (`github.com/hyperliquid-dex`) ·
  Discord (`discord.gg/hyperliquid`) · X (`twitter.com/hyperliquidX`).
- **© 2025.**
- Quiet, single-row, low-contrast — footer is reference, not a second navigation surface.

## Mobile nav
Below `md (768)` the pill collapses to logo + a menu affordance (hamburger) + Launch App; the three
text links move into a sheet/menu. (Standard Chakra responsive collapse — see `responsive.md`.)

## Takeaways for Ninety's landing page
1. **One floating pill nav**, high-contrast against the hero, with **exactly one filled CTA**
   ("Launch App" / "Start Trading"). Keep link count to ~3 + CTA.
2. **A landing page is a funnel, not a site map** — every section resolves to one of two actions.
   For us: *Start Trading* (enter the exchange) and *See how it works* (proof-flow / docs).
3. **A typographic signature in the wordmark** (their italic "liquid") — cheap, memorable brand
   detail. Ninety can carry an equivalent micro-signature.
4. Footer stays quiet: legal + socials, one row, low contrast.
