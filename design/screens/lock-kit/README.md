# OMNIPITCH UI Lock Kit — the north-star reference

The locked design reference for the whole `apps/web` build. This is the **reference target** the
ui-craft loop needs (design-cop scores `design/screens/impl/*` against these). Source: the
"Omnipitch UI Lock Kit" design export (imported 2026-07-09; byte-identical PNG duplicates removed).

## The three OMNIPITCH mockups (the buildable designs)
Open the `(standalone).html` files in a browser — they are self-contained (inlined assets).

| File | What it is |
|---|---|
| `Omnipitch North Star (standalone).html` | **THE north star.** The match view — Sofascore skeleton on OMNIPITCH tokens: Momentum River hero (CAN win %, goal glyph, big mono price), Match Prices rail (open/now/peak), the Booth (AI commentary), Attack Momentum, Crowd vs Market, and **lineups / stats / H2H / media INSIDE tabs** (the depth-in-tabs law). Plus the LIVE desktop terminal (favourites rail · River · Booth · leaderboard). Footer: play-money promise + "proofs on Solana devnet". |
| `Omnipitch Terminal (standalone).html` | The dense desktop terminal variant (Hyperliquid feel — ticker, favourites, River-dominant, tight panels). |
| `Omnipitch App (standalone).html` | The mobile/app composition. |
| `*.dc.html` | The design-canvas editable sources (smaller). |
| `*-print-*.html` | Print/flattened variants. |

## `uploads/` — reference-app captures (the "blend" sources)
19 screenshots of the apps the blend borrows from — Sofascore (discovery + the tabbed football
depth), Polymarket (the outcome→probability→trade spine), Hyperliquid (the dark/fast terminal
feel). These define *the blend*, not OMNIPITCH screens themselves.

## How the loop uses this
- `design/screens/` reference crops are cut FROM these mockups. The next artifact is a per-screen
  crop set (match-LIVE first) named to match `design/SCREEN-DATA-MAP.md` rows so `/screen` and the
  design-cop agent have exact targets.
- The palette/type/motion in these mockups is the source for `apps/web/src/design/tokens.ts` +
  `motion.ts` (dark `--bg`, green `--up`, pink `--down`, amber `--halt` on halts, violet `--chain`
  on-chain, IBM Plex Mono numbers) — they line up.

> Play-money law visible in the design itself: "OMNIPITCH is a free-to-play game. Credits are play
> money and have no cash value." No gambling vocabulary anywhere in the reference copy.
