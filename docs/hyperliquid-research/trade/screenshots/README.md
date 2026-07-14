# trade — Screenshot Catalog

> Tooling note (same as hyperfoundation): captures were made live via the Chrome extension for
> analysis; binary files couldn't be persisted to this folder in this environment. Rich descriptions
> below + `../../html/trade.html` reconstruct the visual architecture. Mainnet and testnet
> (`app.hyperliquid-testnet.xyz/trade`) render the identical UI.

| # | Frame | What it shows |
|---|---|---|
| 01 | **Full terminal (HYPE-USDC)** | Dark 4-zone layout: top nav (Trade…Leaderboard…Connect), chart panel with drawing rail + stat strip (Mark 63.779 / Oracle 63.739 / 24h −2.58% / Vol $394M / OI $1.37B / Funding), Order Book (asks pink, Spread 0.001/0.002%, bids green, depth bars), Trade ticket (Cross/10x/Unified · Market/Limit/Pro · Buy-Long green / Sell-Short red · size + % slider · Reduce Only · TP/SL · Connect), bottom dock tabs (Balances…Order History), ● Online pill, footer Docs/Support/Terms/Privacy. |
| 02 | **Announcements popover** | Bottom-right dismissible card: "New listing: CASHCAT-USDC perps", "Added spot ANSEM", "Hyperliquid and Trade[XYZ] data live on TradingView". |
| 03 | *(states to capture on a writable run)* | Market switcher dropdown (searchable) · Buy vs Sell recolor · Limit/Pro ticket variants · Privy connect modal · Positions tab with live PnL · chart crosshair tooltip · mobile bottom-sheet ticket. |

## Colors sampled (computed)
up/long/bid `#1FA67D` · down/short/ask `#ED7088` · text `#D2DAD7` · mint highlight `#F6FEFD` ·
Privy accent `hsl(172,47%,36%)` · borders `#1F2937`.

## Type sampled
Custom **"OurFont"**, weights **400/500**, ~11–14px, **tabular-nums on 436 nodes**. Live price is
also written into the browser tab title (`63.792 | HYPE | Hyperliquid`).
