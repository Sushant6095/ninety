# app.hyperliquid[-testnet].xyz/announcements — Full Analysis

> Consolidated doc (all eight facets). A **filterable changelog / news feed.** The compact
> bottom-right **Announcements popover** seen on Trade/Leaderboard is this same feed in miniature.
> (Captured on testnet — whose nav adds a **Faucet** tab; otherwise identical to mainnet.)

## Purpose · target user · actions
- **Purpose:** a running, categorized log of product news — new listings, delistings, and updates.
- **Target user:** active users tracking what changed (new markets, sunsets, feature betas).
- **Primary action:** scan the latest; **secondary:** filter by category, click through to detail
  (a listing → its market).

## Navigation
- Same persistent app-shell nav (Trade · Outcomes · Portfolio · Earn · Vaults · Staking · Referrals ·
  Leaderboard · **Faucet** [testnet] · More · Connect).
- **Left category sub-nav:** **All Announcements** (active) · Listings · Delistings · Updates — a
  vertical filter rail; the active category highlights (subtle filled row).
- Footer: Docs · Support · Terms · Privacy. ● Online pill.

## Layout (design system)
- Page title **"Announcements"** (large white), left.
- Two columns: **category rail (left, ~narrow)** + **feed list (right, wide)**.
- Same tokens as the app: near-black surfaces, `#D2DAD7` text, muted secondary text, mint accents,
  subtle topographic background texture, hairline row separators.

## Components
1. **Category filter rail** — All / Listings / Delistings / Updates; single-select; active row
   highlighted.
2. **Announcement row (card)** — anatomy:
   - **Title** (bold white) — e.g. "New listing: CASHCAT-USDC perps".
   - **Description** (optional, muted) — e.g. "ANSEM spot trading, deposits, and withdrawals are now
     live".
   - **Date** (muted, `dd/mm/yyyy`).
   - **Category tag** (right-aligned pill badge: Listings / Delistings / Updates) — subtly tinted;
     the type-at-a-glance signal.
   - Rows separated by hairlines; whole row likely clickable → detail/market.
3. **Status/type badge** — small pill (Listings/Updates/Delistings) with category-tinted styling.
4. **Compact popover variant** — the dismissible bottom-right card (title + ✕ + a few latest items)
   shown on other app pages; a condensed view of this feed with a "seen" flag.
5. **Empty state** — per category, "No announcements" (rare).

## Motion
- Category switch cross-fades / filters the list in place (~120ms).
- Popover slides in from the corner; dismiss persists (localStorage "seen").
- Row hover highlight. Minimal, appropriate for a feed.

## Responsive
- Desktop: rail + list side by side.
- Mobile: category rail becomes a **horizontal chip strip** or a dropdown above the list; rows
  full-width; the tag stays but may move under the title.

## Interaction
- **Filter** by category (rail). **Click** a row → detail / related market. **Dismiss** the popover
  (persists). Possibly deep-link per announcement.
- States: default list (reverse-chronological), filtered, empty, popover (compact + dismissible).

## Performance
- Static-ish: server-render the feed (or fetch + cache); it's low-frequency content. The popover
  checks a "latest seen" id to decide whether to show. No heavy runtime.

## Takeaways for Ninety
1. **A categorized changelog feed** (Listings/Delistings/Updates) is exactly what a live exchange
   needs — for us: new markets, market halts/settlements, feature updates. Reuse **one row primitive**
   (title · desc · date · category badge).
2. **Category rail filter** + reverse-chronological list = the clean, learnable pattern.
3. **A compact dismissible popover** of the latest items on other pages (with a "seen" flag) keeps
   news visible without a dedicated visit — great for surfacing **new markets / halts** in-context.
4. **Category-tinted badges** give type-at-a-glance; keep them semantic and subtle.
5. Testnet's **Faucet** tab is a reminder: gate testnet-only affordances behind the environment
   (relevant to our play-money/testnet posture).
