# hyperscreener.asxn.xyz/validators — Full Analysis

> Consolidated doc (all eight facets in labeled sections). A **third-party analytics dashboard**
> (ASXN "Hyperliquid Analytics") — not first-party, but it adopts the Hyperliquid brand palette and
> is an excellent reference for **data-dashboard / geographic-viz** patterns.

## Purpose · target user · actions
- **Purpose:** monitor Hyperliquid's validator set — count, stake, commission, APR, and the physical
  geography/operators of the network's nodes.
- **Target user:** stakers, delegators, researchers, node-watchers.
- **Primary action:** read the KPIs + explore the node map / operator drill-down. **Secondary:**
  navigate to other analytics (Revenue, Perps, Spot…), command-palette search, toggle theme, Trade.

## Navigation
- **Mega-menu top nav** (dark pill bar): logo "Hyper*liquid* Analytics" + dropdown sections —
  **HyperCore ▾** (active, holds Validators) · Revenue ▾ · Perps ▾ · HIP-3 ▾ · HIP-4 ▾ · TradFi ▾ ·
  Spot ▾ · HyperEVM ▾ · Traders ▾.
- **Right cluster:** **⌘K command-palette search** · **theme toggle** (dark default / light) ·
  **"Trade · Save 4%"** mint CTA (referral to the exchange).
- IA: a broad analytics suite organized by domain dropdowns; each dropdown lists dashboards;
  Validators lives under HyperCore. Deep but flat (mega-menu, not nested pages).

## Layout (design system)
- Page title **"Validators"** (large white), left.
- **KPI stat row:** 4 tiles — Total Validators **33** · Total Stake **439.21M** · Avg Commission
  **5.62%** · Avg APR **2.15%** — big number + small uppercase label, thin vertical dividers between.
- **"Peers Map" card:** 3 sub-KPIs (Total Nodes 28 · Operators 15 · Locations 4, each with a
  descriptor line) over a two-column split: **world map (left)** + **location/operator detail
  (right)**.
- Palette: dark surfaces + **mint/teal** continents & accents (Hyperliquid brand family); off-white
  text; mono for IPs/numbers. Subtle card borders, rounded ~12–16px cards, faint dot-grid texture in
  the header.
- Both **dark and light themes** (toggle) — unlike the first-party apps (dark-only).

## Components
1. **Mega-menu nav** — sectioned dropdowns; hover/click opens a panel of dashboard links.
2. **Command palette (⌘K)** — global fuzzy search over all dashboards/metrics.
3. **Theme toggle** — dark/light.
4. **KPI stat tile** — big value + uppercase label; row of 4 with dividers.
5. **World-map node viz (SVG)** — mint-filled continents on dark; **node markers** at locations
   (Germany, Japan, South Korea, Singapore); **zoom in/out** controls; click a marker → detail.
6. **Location detail panel** — "Japan · 22 nodes · 13 operators" + **operator cards** (name, # IPs,
   IP-address chips in mono).
7. **CTA chip** — "Trade · Save 4%" (referral).
8. Tables/charts elsewhere in the suite (validator list with commission/APR/stake, sortable) — the
   Validators page pairs the map with a ranked validator table further down.

## Motion
- Map: marker hover tooltips, zoom/pan transitions, subtle marker pulse for active nodes.
- Nav dropdowns/command palette: fast open (~150ms); theme toggle cross-fades colors.
- KPI numbers may count-up on load. Restrained overall.

## Responsive
- Desktop: KPI row of 4; map + detail side by side.
- Tablet: KPIs 2×2; map stacks above detail.
- Mobile: KPIs stack/2-up; map becomes a simplified/scrollable viz or a list of locations; operator
  cards single-column; mega-menu → drawer; ⌘K → a search icon.

## Interaction
- **Explore the map:** hover markers (tooltip), click → location/operator drill-down, zoom.
- **Command palette:** ⌘K → type → jump to any dashboard/metric.
- **Nav dropdowns:** browse the analytics suite.
- **Theme toggle.** Sort the validator table by stake/commission/APR.
- States: loading (skeleton KPIs + map), empty (rare — network data), populated (default).

## Performance
- Static-ish analytics: server-render/ISR the KPIs + validator list; the map is an inline **SVG**
  (light, crisp, themeable) with data-driven markers. Command palette indexes routes client-side.
  Data refreshed periodically (not high-frequency WS like the terminal). Lazy-load the map + heavy
  charts below the fold.

## Takeaways for Ninety
1. **KPI stat row** (big value + label + dividers) is the ideal header for any analytics/overview
   surface (e.g. a market's or the exchange's top-line stats).
2. A **command palette (⌘K)** is a premium power-user affordance worth adding once we have many
   surfaces — fastest navigation for pros.
3. **Geographic / structural SVG viz** (themeable, marker drill-down) is a model for any "where/what
   is happening" map we might show (e.g. live markets by competition/region).
4. **Drill-down pattern:** overview KPIs → pick an entity → detail panel with sub-cards. Clean way to
   layer depth.
5. This third party **reusing the Hyperliquid palette** shows the power of a strong brand ramp — an
   ecosystem tool feels native. Our token system should be equally adoptable.
