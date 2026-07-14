# trade — Components

The reusable primitives of the terminal. Each: purpose / variants / states / spacing / motion / a11y
/ composition / impl / perf.

## 1. Market header + stat strip
- **Purpose:** identify the instrument + its live vitals.
- **Contents:** pair symbol `HYPE-USDC ▾` + leverage badge `10x`; strip of **Mark · Oracle · 24h
  Change · 24h Volume · Open Interest · Funding / Countdown**.
- **States:** values stream live; 24h change colored (red −2.58%); funding has a countdown timer.
- **Impl:** WS-subscribed; each stat a label+value; tabular; flash on change.
- **Perf:** subscribe once, patch values; don't re-render the strip.

## 2. Market switcher (searchable dropdown)
- **Purpose:** change instrument fast.
- **Variants:** perps / spot tabs; searchable; shows price + 24h change + volume per row.
- **States:** open/closed; typing filters; hover/active row; favourites (★).
- **A11y:** combobox + listbox, keyboard nav, Esc close.
- **Impl:** virtualized list (hundreds of markets); WS mini-tickers per visible row.

## 3. Order book
- **Purpose:** live depth — the heart of the terminal.
- **Anatomy:** columns **Price · Size · Total**; **asks** (pink `#ED7088`) descending to the
  **Spread** divider (`0.001 / 0.002%`), then **bids** (green `#1FA67D`); each row has a **depth bar**
  (translucent fill sized to cumulative total). Precision selector (`0.001`) + unit selector (HYPE).
- **States:** live updates (rows recolor/flash on change); hover row → highlight + (click to
  pre-fill price); grouping precision changes aggregation.
- **Motion:** in-place value changes; depth bars animate width subtly; no row reflow.
- **A11y:** table semantics; announce best bid/ask politely; not color-only (numbers present).
- **Impl:** WS book feed → diff-patched rows; **virtualize** long books; depth bar = one absolutely-
  positioned element per row; requestAnimationFrame batching for high update rates.
- **Perf:** the highest-frequency component; patch cells, never rebuild; cap paints to rAF.

## 4. Recent trades (tape)
- **Purpose:** live executed trades.
- **Anatomy:** Price (colored by side) · Size · Time; newest on top, prepends.
- **Motion:** new rows fade/slide in at top; color-coded by aggressor side.
- **Impl:** WS trades feed; capped list; prepend + drop tail; virtualize.

## 5. Trade ticket (order form)
- **Purpose:** size and submit an order.
- **Variants / controls:**
  - Margin mode **Cross / Isolated**; **leverage** (10x…); **Unified** account toggle.
  - Order type tabs **Market · Limit · Pro** (Pro = advanced: scale/TWAP/stop, etc.).
  - **Buy/Long (green) ↔ Sell/Short (red)** segmented toggle.
  - **Available to Trade**, **Current Position** readouts.
  - **Size** input + unit selector + **% slider** (0–100 with step dots).
  - **Reduce Only**, **Take Profit / Stop Loss** checkboxes (reveal extra fields).
  - Primary CTA: **Connect** (pre-auth) → **Buy/Sell** (post-auth) with est. liquidation price,
    fees, slippage.
- **States:** empty / invalid (disabled CTA) / insufficient balance / connect-required / submitting
  / filled (toast). Buy vs Sell recolors the whole CTA.
- **A11y:** labeled inputs, radio-group toggles, slider with value, disabled reasons announced.
- **Impl:** controlled form; derive liq price/fees from inputs; optimistic order placement + toast;
  the CTA is the boldest control (semantic green/red).
- **Perf:** local state; only the balance/position readouts are live-subscribed.

## 6. Chart panel
- **Purpose:** price action + technical analysis.
- **Contents:** candlesticks (canvas), OHLC readout, timeframe toolbar (5m/1h/D + range strip), left
  **drawing-tool rail**, Indicators, log/auto scale, UTC clock, fullscreen.
- **Interaction:** crosshair w/ axis tooltips, hover OHLC, zoom (wheel), pan (drag), draw tools,
  resize.
- **Impl:** TradingView-style canvas charting; WS candle updates append the live bar.
- **Perf:** canvas (offloads DOM); throttle to rAF; only the live candle mutates.

## 7. Bottom dock (positions/orders/history)
- **Purpose:** account state + activity.
- **Tabs:** Balances · Positions · Outcomes · Open Orders · TWAP · Trade History · Funding History ·
  Order History; Type/Side filters.
- **States:** empty ("no open positions") per tab; live PnL on Positions (colored); cancel/close
  actions inline.
- **Impl:** each tab a table; Positions live-subscribed (PnL colored); histories paginated/virtualized.

## 8. Announcements popover
- **Purpose:** product news (new listings, features) — a dismissible bottom-right card.
- **Contents:** "Announcements" title + ✕; list of items (e.g. "New listing: CASHCAT-USDC perps").
- **Motion:** slides in; dismiss persists (don't re-show).
- **Impl:** feed-driven; localStorage "seen" flag. (See the dedicated `../announcements/` folder.)

## 9. Connect / wallet chip
- **Purpose:** auth entry → account.
- **States:** Connect (mint) → connecting → account chip (address + balance).
- **Impl:** Privy modal (email/social/wallet + WalletConnect); persists session.

## 10. Status pill + footer
- **● Online** (green dot) connection health, bottom-left; footer links Docs/Support/Terms/Privacy.

## Composition
`AppShell(nav + Connect)` wraps a `Terminal(ChartPanel | BookTradesPanel | Ticket)` over a
`BottomDock(tabs)`. Every numeric surface shares the tabular type + semantic up/down colors, so the
terminal reads as one instrument.

## For Ninety
Rebuild these as our market-page primitives, but swap the generic candlestick hero for the
**Momentum River + live price**, keep the book/tape/ticket craft, and make the CTA a **play-money
Buy/Sell** with credits. Virtualize book/tape/history; patch don't rebuild; flash on change.
