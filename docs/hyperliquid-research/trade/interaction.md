# trade — Interaction

## Core loop
1. **Pick a market** (searchable switcher) → 2. **read** (chart + book + tape + stats) → 3. **size**
(ticket: type, side, size/%, TP-SL) → 4. **Connect** (if needed) → 5. **submit** → 6. **manage**
(bottom dock: positions/orders/history). All without leaving the terminal.

## Key interactions
- **Order book → ticket:** clicking a book price pre-fills the limit price; clicking size can
  pre-fill size. The book is an input surface, not just a readout.
- **% slider:** sizes the order as a fraction of available margin (step dots at 25/50/75/100).
- **Buy/Long ↔ Sell/Short:** recolors the entire ticket + CTA (green/red) — unmistakable side state.
- **Order-type tabs:** Market/Limit/Pro reveal different field sets (limit price, advanced options).
- **Reduce Only / TP-SL:** checkboxes that reveal conditional fields — progressive disclosure inside
  the form.
- **Chart:** crosshair with live axis tooltips, wheel-zoom, drag-pan, drawing tools, indicators,
  fullscreen, log/auto scale, timeframe switch.
- **Bottom dock:** inline cancel/close on open orders/positions; filters (Type/Side); tab switch.

## States
- **Pre-connect:** everything readable; ticket CTA = **Connect**; Portfolio/positions empty prompts.
- **Connecting:** Privy modal (email/social/wallet); loading.
- **Connected:** balances/positions populate; CTA becomes Buy/Sell; account chip in nav.
- **Loading:** skeleton/placeholder rows while WS warms up; **● Online** health pill.
- **Empty:** "No open positions/orders" per dock tab; empty book only on illiquid markets.
- **Error:** WS disconnect → pill flips to reconnecting; order errors → inline + toast.
- **Live:** the default — streaming book/trades/price/PnL, in place.

## Keyboard & focus
Pro terminals reward keyboard use: focusable inputs, tab order through the ticket, Enter to submit,
Esc to close modals/menus. (Deeper hotkey coverage not exhaustively verified.) Focus rings on
controls.

## Accessibility watch-items
- High-frequency live regions must be **polite** (or off) to avoid screen-reader spam — announce
  meaningful changes (fills, best bid/ask on request), not every tick.
- Color is never the only side signal (Buy/Sell labels, +/− signs present).
- Dense tables need proper roles + headers.

## For Ninety
- **Make the book/price an input** (click-to-fill).
- **Progressive disclosure in the ticket** (advanced options behind toggles).
- **Read-before-connect**; gate only submission.
- **Health pill + reconnect** for our live feed; skeletons while the socket warms.
- Keep our **play-money** framing in states (credits, no real liquidation) while matching the
  interaction fluency.
