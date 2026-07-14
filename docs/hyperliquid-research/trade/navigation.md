# trade — Navigation

## Global top nav (dark bar, ~56px)
```
[◐ Hyperliquid]  Trade  Outcomes  Portfolio  Earn  Vaults  Staking  Referrals  Leaderboard  More ▾    [Connect]  🌐  ⚙
```
- **Left:** logo (mark + wordmark).
- **Center: product tabs** — the app's whole surface area:
  - **Trade** (this terminal) · **Outcomes** (prediction/event markets) · **Portfolio** (positions,
    balances, PnL) · **Earn** · **Vaults** (copy/managed vaults) · **Staking** (HYPE) · **Referrals**
    · **Leaderboard** · **More ▾** (overflow: docs, stats, sub-apps).
- **Right:** **Connect** (wallet, mint/green) · **🌐 locale** switcher · **⚙ settings**.
- Active tab is emphasized (color/underline). The nav is persistent; switching tabs swaps the main
  canvas without leaving the app shell.

## In-terminal navigation (secondary)
- **Market switcher:** the `HYPE-USDC ▾` selector (top-left of chart) opens a searchable market list
  (perps + spot, with prices/change) — the fastest way to change instrument.
- **Center panel tabs:** Order Book ↔ Trades (+ overflow ⋮ for settings/precision).
- **Ticket tabs:** Market · Limit · Pro (order types); Cross/Isolated + leverage + Unified.
- **Bottom dock tabs:** Balances · Positions · Outcomes · Open Orders · TWAP · Trade History ·
  Funding History · Order History — with Type/Side filters.
- **Footer links:** Docs · Support · Terms · Privacy Policy.

## Information architecture
```
App shell (persistent nav + Connect)
├── Trade (terminal)
│   ├── market switcher → any perp/spot
│   ├── chart · order book/trades · ticket
│   └── bottom dock: positions/orders/history tabs
├── Outcomes  ├── Portfolio  ├── Earn  ├── Vaults
├── Staking   ├── Referrals  ├── Leaderboard
└── More ▾ (docs, stats, …)
```
Depth is **in-panel** (tabs everywhere), not new pages — you stay in the terminal and re-scope it.
Same "depth-in-tabs, one persistent shell" philosophy as SofaScore's match page, applied to trading.

## Wallet flow
**Connect** → Privy modal (email/social/wallet options; WalletConnect for external wallets). Pre-auth
the terminal is fully readable; post-auth the ticket + Portfolio unlock. Connect state persists;
the button becomes an account chip.

## Takeaways for Ninety
1. **One persistent app shell** with product tabs across the top; the market page is one tab.
2. **A searchable market switcher** in the terminal header (fastest instrument change) — ours spans
   matches/markets.
3. **In-panel tabs for depth** (book/trades, order types, positions/history) — don't navigate away.
4. **Read-before-connect**; Connect is the only gated action; wallet via a Privy-style modal.
5. Reserve a **Leaderboard** and **Portfolio** tab in the shell from day one (we already have
   `/leaderboard`).
