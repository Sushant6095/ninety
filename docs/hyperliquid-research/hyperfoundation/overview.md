# hyperfoundation.org — Overview

> The model for **Ninety's first page.** This is the Hyper Foundation marketing/landing site: a
> single long-scroll narrative page that sells "the blockchain to house all finance." Analyzed live
> July 2026. No source/asset copied — patterns and measurements only.

## Purpose
A **conviction-building landing page**, not an app. It exists to (1) state a grand thesis, (2) prove
performance with live numbers, (3) explain the architecture (HyperCore / HyperEVM / HyperBFT), and
(4) funnel to two actions: **Start Trading** (users) and **Start Building** (developers).

## Target user
Two audiences, addressed in one page: **traders** (flagship perps/spot DEX, low fees, 40x leverage)
and **builders** (HyperEVM, Ethereum tooling). Plus a token/community audience (HYPE, "own a piece").

## Primary action
**Start Trading** → the app (`app.hyperliquid.xyz/trade`). The mint filled pill is the single
loudest control on the page and repeats at top (hero) and bottom (closing CTA).

## Secondary actions
- **Start Building** (outline pill) → docs/builder path.
- **Launch App** (nav pill) → the app.
- **Stats** (nav) → live metrics band / stats.
- **Docs** (nav) → GitBook docs.
- **Ecosystem** (nav) → GitBook HyperEVM ecosystem.
- Footer: Telegram, GitHub, Discord, X; legal (Terms, Privacy, Genesis Event Terms, NFT Terms).

## The page in one scroll (narrative order)
1. **Hero** — mint logo mark + serif headline "The Blockchain To House All Finance" + subcopy +
   dual CTAs, on a dark-green gradient with organic 3D blobs. *Pinned scrollytelling stage.*
2. **Flagship exchange** — "The premier **DECENTRALISED** exchange" (animated letter reveal) + 4
   feature blocks: **Low fees · Up to 40x leverage · Transparent · Seamless.**
3. **The Stack** — an **interactive SVG architecture diagram** (HyperCore ↔ HyperEVM as one unified
   state; HyperBFT consensus) with labeled blocks: vaults, perps, oracles, spot, governance,
   bridges, auctions, wired by animated arrows. The conceptual centerpiece.
4. **Live stats band** — Block time **0.07s** · Users **2,261,901** · Max TPS **200,000** · Daily
   volume **$9.1B**. Real, large, mono numbers.
5. **Community / HYPE** — "No investors. No paid market makers. No fees to any company. Community
   first." → own/govern/secure via HYPE.
6. **Closing CTA** — "Own a piece of Hyperliquid today" + Start Trading / Start Building repeated.
7. **Footer** — © 2025, legal links, social icons.

## Why it feels premium (the transferable thesis)
- **Editorial restraint + one signature.** A *serif* display face (Teodor) on a crypto site reads as
  confident and grown-up; everything else is quiet Inter. Only weights 300/400 — airy, unhurried.
- **Monochrome discipline.** The entire palette is one teal→green ramp (`#97FCE4` mint → `#02231E`
  near-black green). No competing colors. The mint is spent only on the primary action + logo.
- **Show, don't tell.** The architecture is a *diagram you scroll through*, and the performance is
  *live numbers*, not adjectives.
- **Motion as the reward.** A pinned hero whose logo mark morphs on scroll; letter-by-letter reveals;
  arrows that draw. Motion is concentrated in a few high-craft moments, not sprinkled everywhere.

## Tech stack observed (informs how to rebuild)
- **Chakra UI** design-token system (496 `--chakra-*` vars) — see `layout.md` / `components.md`.
- Wallet layer: **Privy** (`--privy-*`) + **WalletConnect** (`--wcm-*`) — the Launch App / connect
  flow.
- Fonts: **Teodor** (serif display) + **Inter** (UI) + system mono for numbers.
- Scroll-linked animation is custom (no global GSAP/Lenis/Locomotive detected) — likely
  Framer-Motion `useScroll` + transforms; **`document.body` is the scroll container**, and the hero
  is **pinned** across a long scroll range.

## What Ninety takes from this page
See [`../../NINETY-DESIGN-LAWS.md`] (SofaScore research) for our core laws; this page adds the
**landing-page playbook**: one serif thesis headline, a monochrome brand ramp with a single spent
accent, an interactive architecture diagram, a live-stats proof band, and a pinned-hero signature
moment — reskinned to Ninety's dark exchange identity and the Momentum River.
