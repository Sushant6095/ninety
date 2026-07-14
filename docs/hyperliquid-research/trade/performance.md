# trade — Performance

A live terminal is a **high-frequency rendering** problem. The craft is keeping thousands of updates
per minute smooth.

## The load
- **WebSocket streams:** order book deltas, trade tape, price/mark/funding, positions/PnL — many
  updates per second.
- **Canvas chart** with a continuously-updating live candle.
- Large tables (book, tape, histories) that could thrash the DOM if rebuilt.

## How it stays smooth (observed / inferred)
- **Tabular fixed-width columns** → no layout recalculation on value change; only text/color patch.
- **Patch, don't rebuild** → diff book/tape rows and mutate cells; never re-render the whole list.
- **Virtualization** for long lists (book depth, trade tape, histories).
- **Canvas for the chart** → offloads price rendering from the DOM; only the live bar mutates.
- **rAF batching** of high-frequency updates → coalesce bursts into one paint per frame.
- **In-place, no reflow** → the layout is fixed; updates never move neighbors.

## Rebuild recommendations (for Ninety's market page)
- **One WS connection**, fan out to stores; **throttle/coalesce** to rAF (e.g. one book snapshot per
  frame, not per message).
- **Virtualize** the order book, trade tape, positions, and history.
- **Fixed-width tabular columns** so ticks never reflow; flash color via a class toggle, not layout.
- **Canvas or lightweight-charts** for the price chart (we already use `lightweight-charts`); keep
  the **Momentum River** on GPU-friendly rendering (SVG/canvas), transform/opacity only.
- **Optimistic order placement** + toast; reconcile on ack.
- **Health pill + auto-reconnect** with backoff; buffer/resume on reconnect (we already have WS
  resume buffers per our architecture law).
- **Code-split** the heavy chart + wallet SDK; lazy-load the ticket's advanced (Pro) options.
- Budget: this is an "app page" (our rules allow < 300kb JS gz) — but the chart + wallet dominate;
  lazy-load both and keep the initial terminal shell light.

## Accessibility-perf intersection
Throttle live-region announcements to meaningful events (fills, best bid/ask on request) — never
announce every tick, or you spam screen readers *and* burn cycles.
