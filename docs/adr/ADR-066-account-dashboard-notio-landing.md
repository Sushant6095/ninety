# ADR-066 — /account is the forecasting record; notio is structure, never skin

Status: accepted 2026-07-16 (`worktree-dashboard-components-pass` → `merge/live-integration`).
Cross-ref: ADR-049 (one shell), ADR-060/061 (Next Goal), ADR-063 (motion/gradient exceptions),
design/verdicts/2026-07-16-pass2.md, design/PROVENANCE.md "pass 2" ledger.

## 1. The /account decision (page content + route reconciliation)

Play money makes one thing the product: **being right**. /account is therefore the *verifiable
forecasting track record*, not a wallet: credits (granted 1,000/match, no cash value — stated on
the page twice), open positions (entry vs live probability, P&L in credits), forecast accuracy
(hit-rate, best call, trade streak, live Next-Goal streak), moments owned (minted swing cards WITH
their Solscan mint receipts), leaderboard rank + percentile, on-chain proof history (ProofBadge →
Solscan — the page's only violet), and the watchlist.

Route reconciliation — no third overlapping page: **/account IS the upgraded portfolio.**
`/portfolio` is a permanent in-app redirect (bookmarks survive; `routes.portfolio` deliberately
still points at the redirect so every legacy consumer funnels through one hop), nav surfaces say
**Account** and link `routes.account` directly, and `/profile/[handle]` remains the public page.
The old `PortfolioPage.tsx` is deleted.

Shell provenance: the watermelon.sh `web3-dashboard` block (MIT) provided the LAYOUT (rail, topbar,
stat grid, panels); every web3/money affordance in it — asset tables, swap/deposit/withdraw, APY,
wallet balances — was deleted, not restyled. The wallet is identity + proof links only. recharts
(banned second chart lib) → the repo's EquityCurve/Sparkline; @tabler → lucide; shadcn regDeps →
repo primitives.

## 2. notio → landing (structure, never skin)

The styleui.dev `notio` template (81 files, license undeclared) was pulled to
`design/reference/notio/` and **none of it ships** — it is a structural study. The landing adopted
its rhythm: sticky nav (replacing the hero's inline header — one wordmark, one CTA), hero with
inline product demo (our River — already aligned), demo section (LoopStage halt replay), feature
grid (pillars) + two deep-dives (price, proof), stats band, pricing slot, testimonial slot, footer.
Two slots were deliberately INVERTED rather than copied: **pricing → FreeCredits** ("One price:
free." / one card / "THERE IS NO SECOND TIER." — tiering is meaningless under the play-money
invariant, and saying so is the section), and **testimonials → BoothQuotes** (the Booth's real
minute-stamped lines; invented customers are banned content). Skipped: logo cloud (no real partner
logos), team section, all theme machinery (dark-only law). The River hero is regression-gated by
`apps/web/scripts/assert-river.mjs` (no visible 300×150 default canvas — the blank-River class).

## 3. Component provenance / licenses (pass 2)

| Source | Item | License | Ruling |
|---|---|---|---|
| registry.watermelon.sh | web3-dashboard | MIT (repo) | shell only, guts replaced |
| dotmatrix.zzzzshawn.cloud | dotm-square-3 (+core) | **Custom Proprietary** — app embedding expressly permitted; resale/redistribution as a component library prohibited | in-grant for our use; NOT open-source despite site copy — flagged |
| componentry.dev | dithered-logo | MIT | landing accent below-lg; never the 16px favicon |
| styleui.dev | notio | **undeclared** (publicly served JSON; site sells templates) | structure study only, zero markup shipped |
| npm | balloons-js 0.0.3 | MIT | ⚽ + token colors on streak milestones; emoji defaults never called; PRM never fires |

dotm-square-3 is THE app loading primitive (`components/ui/Loading.tsx`): currentColor dots, css
trimmed 26KB→4.2KB, PRM → static grid, `role="status"`. Skeletons remain for content-shaped
placeholders — loader vs skeleton is indeterminate-vs-shaped, not a style choice.

## Consequences

- Any future "wallet"/"balance" UI on /account is a play-money-law violation by construction — the
  page's framing (record, not money) is the guardrail.
- The hidden mobile-variant charts that mount as 300×150 inside display:none containers are a known
  pre-existing inefficiency (verified identical on prod) — tracked for a lazy-mount fix, expressly
  NOT covered by the River gate.
- The dotmatrix license terms travel with the vendor dir header; if Ninety ever ships a component
  library, that dir cannot be part of it.
