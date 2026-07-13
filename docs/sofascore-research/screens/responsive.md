# Responsive Behavior

Breakpoint tokens (`--breakpoints-*`): **xs 480 · sm 768 · md 992 · lg 1344**. The critical
transition is **md (992px)** — the three-zone desktop shell collapses to a single column here.
Measurements below at 390px are re-verified live; 768/1024/1280/1536 are documented from the
breakpoint tokens + observed collapse rules.

## 390px (mobile, verified)
- **Header collapses 160 → 96px.** The match ticker (top strip) is dropped; logo + search + sport
  nav remain.
- **Sport nav becomes horizontally scrollable** (swipe through Trending/Football/Cricket/…).
- **Single column.** Left/center/right zones stack into one; the match list is the page. Featured
  card + team-of-week stack below the list.
- **Ads inline** between content blocks (still present, ~full-width).
- **No bottom tab bar on the web build** — that's the native-app pattern; web keeps the top sticky
  nav. (A deliberate distinction worth noting for us.)
- Entity tabs (match/league/player) become horizontally scrollable strips.

## 768px (sm — large phone / small tablet)
- Still effectively single-column for the main content; the right ad rail stays hidden.
- Search may still be full-width in the header; sport nav scrollable.
- Standings/stat tables begin to fit more columns before needing horizontal scroll.

## 992px (md — the pivot)
- **Rails return.** The layout goes from single-column to (at least) list + detail. The right ad
  rail is the *last* to appear.
- Header regains its fuller height/rows as width allows.

## 1024–1280px
- Two-to-three zones depending on width; center detail canvas widens; tables show full column sets.
- Comfortable desktop reading; gutters grow via `spacing` tokens.

## 1344px (lg) and 1536px+
- **Full three-zone shell** (left ~570 · center ~530 · right ~300 at 1440). Above `lg`, the layout
  is capped/centered — extra width becomes margin rather than stretching data rows (numbers don't
  benefit from ultra-wide rows).

## Collapse priority (what drops first → last)
1. Match ticker (top strip) — first casualty on narrow.
2. Right ad/widget rail.
3. Left context rail merges into the single column.
4. Tab bars → horizontal scroll.
5. Table columns → condense / horizontal scroll (never truncate the team name — the *condensed
   font* buys width here).

## Typography / spacing scaling
The type scale is **not fluidly resized** per breakpoint much — 14/16px hold across sizes because
they're already efficient. Density is managed by *layout collapse and column shedding*, not by
shrinking text below legibility. Touch targets grow on mobile (rows get taller for thumbs).

## Overflow discipline
- Long names use the **condensed cut** + ellipsis as a last resort, never wrapping a table row.
- Horizontal scroll is contained to the specific table/tab strip, never the page body.

## Takeaways for Ninety
1. **Pick one hard pivot** (≈`md`/992) where the desktop rails collapse to a single column; don't
   die by a thousand micro-breakpoints.
2. **Collapse priority:** decoration → ancillary rails → context rail → tab-scroll → column-shed.
   The **live price + Momentum River** must survive to the narrowest screen.
3. **Contain horizontal scroll** to the order book / table, never the page.
4. **A condensed numeric font** earns its place most on mobile, where column width is scarcest.
5. Decide the **bottom-nav question deliberately** — it's an app convention; on responsive web,
   SofaScore keeps top nav. For a PWA-leaning exchange, a bottom action bar (Trade/Book/Positions)
   may be worth it, but treat it as an explicit choice.
