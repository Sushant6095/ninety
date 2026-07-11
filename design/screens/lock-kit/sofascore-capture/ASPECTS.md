# Sofascore.com — homepage capture (design reference)

Captured 2026-07-10 via **Firecrawl MCP** (branding + links + full-page screenshot) and a real
**Playwright** browser (crisp render, since Sofascore is a Cloudflare-protected virtualized SPA that
paints blank center content under Firecrawl's headless capture).

Files in this folder:
- `home-abovefold-1440.png` — real above-the-fold render (Playwright, the usable design reference)
- `home-fullpage-1440.png` — real full-length render (Playwright)
- `home-firecrawl-fullpage.png` — Firecrawl full-page (left competition sidebar only rendered)

> ⚠️ This is Sofascore's **default LIGHT theme**. The lock-kit reference shots we design against are
> Sofascore in **dark mode** (a user toggle). Ninety is dark-only (design law), so use dark-mode
> Sofascore for skin, and this capture for **structure / layout / density**.

---

## Brand tokens (Firecrawl `branding` format)

**Fonts** — `Sofascore Sans` (custom, body + heading), stack falls back to
`-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif`. One family, weights carry hierarchy.

**Type scale** — h1/h2 `12px` (uppercase section labels), body `14px`. Very small, dense.

**Spacing** — base unit `4px`; card border-radius `6px` (pills use `24px`).

**Colors** (Firecrawl auto-extraction — corrected where its LLM mislabeled):
| Role | Value | Note |
|---|---|---|
| Brand blue (header) | `#2C3EC4` | `theme-color` meta — the real primary |
| Link / active text | `#374DF5` | brighter blue, tabs + links |
| Page background | `#EDF1F6` | cool off-white |
| Surface | `#FFFFFF` | cards |
| Live pill | bg `#EADBE0` / text `#CB1818` | the red "Live (27)" chip |
| Text primary | `#222226` / `#0C0C0D` | near-black |
| `#0000EE` "primary" | — | Firecrawl artifact (default UA link color); ignore |

**Components** — inputs: white, square (`0px` radius), no shadow. Primary button: pill (`24px`).
Secondary button: white, `4px` radius. Flat design — **no shadows anywhere** (`shadow: none` on every component).

**Personality** (Firecrawl): tone *modern*, energy *high*, audience *sports enthusiasts*, framework *custom*.

---

## Layout & structure (from the real render)

**1. Top live ticker** (full-bleed, dark red→green gradient) — horizontally scrollable live/upcoming
matches: `11' 🇫🇷 0-0 🇲🇦`, `Spain–Belgium`, `Quarterfinals 12 Jul`, `Norway–England 02:30`,
`Argentina–Switzerland 06:30`, pause button at right.

**2. Header** (blue `#2C3EC4`, full width) — Sofascore logo · giant centered search
("Search matches, competitions, teams, players, and more") · `SIGN IN` · ⭐ · ⚡ · ⚙️.

**3. Sport tabs row** (white) — Trending · WC26 · **Football (27, active)** · Cricket · Tennis (24) ·
Basketball (4) · Table tennis (26) · Baseball (2) · Motorsport · Badminton · Volleyball (4) ·
American football · More ··· | NEWS · FANTASY · TORNEO. Counts = live events per sport.

**4. Three-column body:**
- **Left (~40%) — match list.** Tabs: All / Favourites / Competitions. Date nav (`‹ Today ›`).
  Filter pills: `Live (27)` (active, red), `Finished`, `Upcoming`. `Odds` toggle (right).
  Grouped by competition (trophy/flag icon + name + country + live count + collapse chevron).
  Each row: kickoff time **or** minute (`11'`, `85'`, `FT`) · club-crest icons · two team names stacked ·
  score column · ⭐ favourite. Finished rows dim the losing side.
- **Center (~35%) — featured carousel.** "FIFA World Cup 2026" hero card (dark, subtle gradient banner):
  Knockout · Quarterfinals · **Argentina vs Switzerland** with large flag discs + date/time ·
  **"Who will win? Cast your vote!"** → 3 buttons (Argentina / X / Switzerland) · Prev/Next + carousel dots.
  Below: **"Team of the week"** (Round-of-16 dropdown) — pitch with player photo discs + rating chips
  (8.5, 9.1 Haaland, 9.3 Messi …) + `</>` embed button + info tooltip.
- **Right (~25%) — promos.** "Advertisement" label · Sofascore Podcast card (Episode 9, Nurkić, Watch now) ·
  Torneo "Try Torneo for free" promo. (Ad-driven rail — Ninety's equivalent is Featured + Top-traders + Moment.)

**5. Density** — very tight rows (~40px), tiny 12px labels, flat white cards on cool-grey bg, blue accents,
crest/flag icons everywhere, live counts on every group. Information-dense, calm, no depth/shadow.

---

## Navigation taxonomy (Firecrawl `links`)

**Sports:** football, basketball, tennis, ice-hockey, american-football, motorsport, mma, esports,
volleyball, table-tennis, cricket, darts, rugby, handball, snooker, badminton, cycling, waterpolo,
futsal, beach-volley, aussie-rules, minifootball, floorball, bandy, padel.

**Top football competitions:** UEFA Champions League (7) · Europa League (679) · Conference League (17015) ·
Premier League (17) · LaLiga (8) · Bundesliga (35) · Serie A (23) · Ligue 1 (34) · Brasileirão (325) ·
FIFA World Cup / World Championship (16).

**Sections:** `/trending` · `/favorites` · `/news` · `/fantasy/landing` · `/squad-builder/world-cup` ·
`/user/weekly-challenge` · `/football/player/compare` · `/football/team/compare` · `/upgrade` (paywall) ·
`/football/rankings/fifa` · `/football/rankings/uefa`. Player pages (`/football/player/{slug}/{id}`),
team pages (`/football/team/{slug}/{id}`), match pages (`/football/match/{slug}#id:{id}`),
tournament pages (`/football/tournament/{country}/{slug}/{id}`) — a deep country→league→match URL tree.

**Corporate/social:** corporate.sofascore.com (advertising, contact) · facebook · x · instagram · tiktok ·
privacy / cookies / accessibility / terms / impressum · iOS app (id 1176147574).

---

## What maps to Ninety (structure only — skin stays dark/Ninety tokens)

| Sofascore | Ninety equivalent (already built) |
|---|---|
| Top live ticker | `Ticker` (live prices, mono) |
| Sport tabs + live counts | date/filter chrome in `CenterColumn` |
| Left grouped match list | `MatchList` grouped by competition |
| Center featured + "who will win" vote | `FeaturedPanel` (River + H/D/A + Trade CTA) |
| Team-of-the-week ratings | (future) match-view depth tabs |
| Right ad rail | Top traders · Starting soon · Moment · Settlement |
| Odds toggle | N/A — Ninety shows price, never odds (copy law) |
