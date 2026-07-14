# app.hyperliquid.xyz/leaderboard — Full Analysis

> Consolidated doc (all eight facets in labeled sections) — directly relevant to Ninety's existing
> `/leaderboard`. Same app shell as `../trade/`.

## Purpose · target user · actions
- **Purpose:** rank traders by performance over a time window; discover top performers; look up an
  address.
- **Target user:** competitive traders, copytraders, the curious.
- **Primary action:** read the ranking (sort by PNL/ROI/Volume). **Secondary:** search a wallet,
  change window, page through, jump to a trader.

## Navigation
Same persistent app-shell nav (Trade · Outcomes · Portfolio · Earn · Vaults · Staking · Referrals ·
**Leaderboard** active · More · Connect). The page itself has no sub-nav — it's a single table view.
Footer: Docs · Support · Terms · Privacy.

## Layout (design system)
- Page title **"Leaderboard"** (large white), left-aligned.
- A **card/panel** holding: a left **search-by-wallet** input, a right **time-window dropdown
  ("30D")**, then the table, then the pager, then a methodology footnote.
- Same tokens as trade: near-black surfaces, `#D2DAD7` text, **"OurFont"** 400/500, **tabular
  numerals**, green/red for positive/negative PnL & ROI.
- A **very subtle topographic contour-line pattern** in the background (atmospheric depth without
  color — a quiet premium touch).
- Content max-width matches the app (~wide, centered).

## Components
1. **Leaderboard table** — columns **Rank · Trader · Account Value · PNL (30D) ▾ · ROI (30D) ·
   Volume (30D)**. Sortable header (PNL default, descending). Trader = address/name → profile.
   Numbers tabular, right-aligned; PnL/ROI colored green/red.
2. **Search input** — "Search by wallet address…" (filters/looks up a specific trader).
3. **Time-window selector** — `30D ▾` (also 7D/all-time etc.); re-scopes every metric column
   (columns literally relabel "PNL (30D)" → "PNL (7D)").
4. **Pager** — Rows per page (10 ▾) + `1-0 of 0` count + prev/next.
5. **Methodology footnote** — "Excludes accounts with < 100k USDC value and < 10M USDC volume. ROI =
   PNL / max(100, starting value + max net deposits) for the window." (A trust/transparency element.)
6. **Empty state** — the table shows `1-0 of 0` when no rows match (clean, not broken).

## Motion
Minimal: sort re-orders rows (optionally animated), window change cross-fades the data, hover row
highlight. No decorative motion. Values could flash if live.

## Responsive
- Desktop: full 6-column table.
- Tablet/mobile: **shed columns** (keep Rank · Trader · PNL; move Account Value/ROI/Volume behind a
  row expand or horizontal scroll); search + window stack above the table; pager compacts. Never
  drop the identity + headline metric.

## Interaction
- **Sort** by any metric (click header). **Search** to find a wallet. **Window** to re-scope.
- **Row → trader profile/portfolio.** Pagination for depth.
- States: loading (skeleton rows), empty (`1-0 of 0` + explanatory footnote), populated.

## Performance
- Server-render the first page; paginate/virtualize for depth; the ranking is computed server-side
  (heavy aggregation) and cached per window. Search hits an indexed lookup. Cheap page overall.

## Takeaways for Ninety (our /leaderboard)
1. **Sortable metric columns + a time-window selector that relabels the columns** (PNL/ROI/Volume ×
   7D/30D/all) — exactly our leaderboard's job (accuracy/P&L/volume).
2. **Search-by-identity** (wallet → for us, trader/handle) always available.
3. **Publish the methodology** as a footnote — it builds trust in the ranking (great for a
   play-money exchange where fairness is the whole point).
4. **Reuse one row primitive**; shed columns gracefully on mobile; tabular numerals; color P&L.
5. A **subtle contour/atmosphere background** adds depth without adding color — fits our quiet-dark
   system (use sparingly, e.g. behind the leaderboard hero).
