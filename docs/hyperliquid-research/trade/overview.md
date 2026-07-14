# app.hyperliquid.xyz/trade — Overview

> The flagship perps/spot trading terminal. The single most relevant reference for **Ninety's
> market/trade screen.** Mainnet and testnet (`app.hyperliquid-testnet.xyz/trade`) are the **same
> UI** — testnet is a data/env swap, not a different design; notes here cover both.

## Purpose
A **professional derivatives trading terminal** in the browser: view a market (chart + order book +
trades), size and place orders (market/limit/advanced), and manage positions/orders/history — all
live, all on-chain.

## Target user
Active crypto perps/spot traders who expect a CEX-grade terminal (think Binance/Bybit density) but
fully on-chain. Power users: keyboard-fast, data-dense, multi-panel.

## Primary action
**Place an order** (Buy/Long or Sell/Short) via the right-hand trade ticket. Before wallet connect,
the CTA is **Connect** (wallet) — the terminal is fully readable pre-auth (chart, book, trades),
trade-gated post-auth.

## Secondary actions
- Switch market (HYPE-USDC pair selector), timeframe, chart tools/indicators.
- Toggle margin mode (Cross/Isolated), leverage (10x…), account mode (Unified).
- Read order book / recent trades; inspect positions, balances, open orders, TWAP, histories.
- Top-nav destinations: **Trade · Outcomes · Portfolio · Earn · Vaults · Staking · Referrals ·
  Leaderboard · More**.

## Layout at a glance (dense 4-zone terminal)
```
┌ top nav: logo · Trade Outcomes Portfolio Earn Vaults Staking Referrals Leaderboard More · Connect 🌐 ⚙ ┐
├───────────────────────────────┬───────────────────────┬───────────────────────────────┤
│ CHART panel                    │ ORDER BOOK / Trades   │ TRADE TICKET                  │
│  pair + leverage + stat strip  │  Price·Size·Total     │  Cross · 10x · Unified        │
│  (Mark/Oracle/24hΔ/Vol/OI/Fund)│  asks (red)           │  Market · Limit · Pro         │
│  drawing rail + TradingView    │  ── Spread ──         │  Buy/Long · Sell/Short        │
│  candles + timeframe footer    │  bids (green)         │  size + % slider · TP/SL      │
│                                │  depth-shaded rows    │  Connect (CTA)                │
├───────────────────────────────┴───────────────────────┴───────────────────────────────┤
│ bottom tabs: Balances Positions Outcomes OpenOrders TWAP TradeHistory FundingHistory OrderHistory │
│ ● Online                                                          Docs Support Terms Privacy      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

## Why it feels premium
- **CEX-grade density done cleanly.** Enormous data (book, trades, stats, positions) with zero
  visual noise: near-black surfaces, one off-white text color, **two font weights (400/500)**, and
  **436 tabular-num elements** so every column is pixel-aligned and never jitters on live ticks.
- **Semantic color only.** Up/long **#1FA67D** green, down/short **#ED7088** pink-red, neutral
  **#D2DAD7**, mint highlight. Nothing decorative.
- **The whole thing is live and calm.** Prices/book/trades stream over WebSocket and update in
  place; the layout never reflows. Even the **browser tab title shows the live price** (`63.792 |
  HYPE | Hyperliquid`).
- **One custom typeface** ("OurFont") — a small brand signature carried into a utilitarian terminal.
- **Read-before-auth.** You can study the market fully before connecting a wallet — low-friction
  funnel; Connect only when you act.

## Tech stack observed
- Custom theme (not a public UI kit; only 83 `:root` vars, all **Privy** wallet tokens exposed).
- Wallet/auth: **Privy** (accent `hsl(172,47%,36%)` teal — same brand family).
- Chart: TradingView-style candlesticks (canvas-based charting; SVG used for UI icons — 73 svg).
- Live data via WebSocket (order book, trades, price, positions).

## What Ninety takes from this
This is the template for our **market page** (the SofaScore match page's trading cousin):
- 4-zone terminal, but our **hero is the Momentum River + live price**, not a generic candlestick.
- Read-before-connect funnel; Connect only on action.
- Two weights, one off-white ink, tabular everything, semantic up/down only.
- Live-in-place updates with zero reflow; price in the tab title.
- Keep our **play-money** identity: same terminal craft, credits not cash, no leverage liquidation
  risk framing unless we choose to model it.
