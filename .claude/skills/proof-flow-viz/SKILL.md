---
name: proof-flow-viz
description: ONLY for the how-it-works / proof-flow page — the single sanctioned use of React Flow in the app. Use when building or refining that page's live trust-path graph. Do not use elsewhere.
---

# proof-flow-viz — the trust path as a live node graph

The how-it-works page renders OMNIPITCH's settlement trust path as a calm, animated node graph
so a fan understands *why* the result is trustworthy:

```
TxLINE feed → score events (game_finalised) → stat-validation proof → Solana validateStatV2 → market SETTLED
```

On a real (or replayed) settlement, a token animates left→right along the edges as each stage
completes. The two on-chain nodes (validateStatV2, SETTLED) use the **violet** chain token; when
settlement lands, the SETTLED node flips to the **green** up token and reveals a **ProofBadge →
Solscan** link.

## Rules
- **Lazy-import React Flow on THIS route only.** It must never enter the shared bundle
  (`const ReactFlow = dynamic(() => import('reactflow'), { ssr: false })` or equivalent).
- **Re-skin React Flow to tokens.** No stock blue nodes/edges — node surfaces, borders, and edge
  strokes all come from `src/design/tokens.ts`. Default RF CSS is overridden.
- **One flow at a time, calm.** No competing animations; the eye follows a single token along the path.
- **Reduced motion → static highlighted path.** Honor `prefers-reduced-motion`: draw the full path
  highlighted, no travelling token.
- Pair the graph with **three plain-language step panels** (what TxLINE proves → what Solana
  checks → what "settled" means) and the **play-money promise line** (no deposits, no cash payouts).
- Copy law applies: sentence case, plain verbs, never bet/stake/odds/wager/gamble.

## Data
Driven by a replayed `settled` envelope (see `design/SCREEN-DATA-MAP.md`, How-it-works row):
WS delivers the settlement, the graph advances stage by stage, and the ProofBadge resolves to the
on-chain Solscan link. This is the only page that visualizes the chain path in motion; the
ProofBadge on a normal SETTLED market (ui-craft §9) is the compact in-app version.
