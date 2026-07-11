---
name: Ninety
description: Live football exchange — trade World Cup markets with play-money credits, settled on-chain.
colors:
  terminal-black: "#0B0D10"
  panel-slate: "#14171C"
  hairline: "#232A33"
  high-ink: "#F5F7FA"
  low-ink: "#97A0AF"
  signal-green: "#2BD97C"
  signal-pink: "#FF3D81"
  halt-amber: "#FFB020"
  chain-violet: "#9D6BFF"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0.04em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
rounded:
  cell: "6px"
  control: "8px"
  card: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "40px"
  "3xl": "64px"
components:
  button-buy:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.terminal-black}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  button-sell:
    backgroundColor: "{colors.signal-pink}"
    textColor: "{colors.terminal-black}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "44px"
  side-toggle-active-buy:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.terminal-black}"
    typography: "{typography.mono}"
    rounded: "{rounded.cell}"
    padding: "6px 16px"
  price-chip:
    backgroundColor: "{colors.terminal-black}"
    textColor: "{colors.high-ink}"
    rounded: "{rounded.cell}"
    padding: "6px 6px"
  price-chip-lead:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.high-ink}"
    rounded: "{rounded.cell}"
    padding: "6px 6px"
  credit-pill:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.high-ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  rail-card:
    backgroundColor: "{colors.panel-slate}"
    textColor: "{colors.high-ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  match-row:
    backgroundColor: "transparent"
    textColor: "{colors.high-ink}"
    rounded: "0"
    padding: "10px 12px"
---

# Design System: Ninety

## 1. Overview

**Creative North Star: "The Quiet Terminal"**

Ninety is a still, near-black trading room where the only thing that moves is the market. The surface is calm and dense — an exchange for live World Cup football priced in play-money credits, where a fan reads the match and trades the moment. Every panel holds its breath; all the visual energy is spent, deliberately, in one place: the Momentum River, the live price line that runs green when a market climbs and pink when it falls. Because the room is quiet, that one live signal reads instantly. This is the whole thesis — restraint everywhere so the market can shout.

The system rejects the aesthetics of the thing it is legally not. It is not a sportsbook: no neon casino felt, no gold coins, no flashing odds boards, no "BET NOW." It is not a crypto-casino: no gradients, no glassmorphism, no "to the moon" hype. It is not a generic SaaS dashboard of identical card grids, and not a cluttered, ad-stuffed live-scores portal. Depth comes from tonal layering and a single hairline-and-shadow elevation move, never from decoration. Numbers are sacred: every one is IBM Plex Mono, tabular, prices to one decimal, and flashes its direction for exactly 180ms on change.

**Key Characteristics:**
- Near-black terminal surface (#0B0D10) with a single elevated panel tone (#14171C).
- One signature element — the Momentum River — carries all boldness; everything else stays quiet.
- All numbers mono + tabular-nums; prices one decimal; 180ms up/down flash on change.
- Semantic color only: green up, pink down, amber for halts, violet for on-chain. Never decorative.
- Depth from a 1px top highlight + ambient shadow over near-black — no gradients, no glass, no light mode.

## 2. Colors

A near-black terminal base with two ink tones and four semantic signals, each earning its place by meaning rather than decoration.

### Primary
- **Signal Green** (#2BD97C): Price up, buy side, gains, and the winning outcome. The dominant live-positive accent — on the River when a market climbs, on the Buy button, on the credit-balance dot, and on the keyboard focus ring.
- **Signal Pink** (#FF3D81): Price down, sell side, losses, and the losing outcome. The live-negative counterpart to green; on the River when a market falls and on the Sell button.

### Secondary
- **Halt Amber** (#FFB020): Market halts only — goal, red card, penalty. A deliberate "the market is frozen" signal. Never used decoratively.
- **Chain Violet** (#9D6BFF): On-chain UI only — proofs, settlement, moments/cNFTs. Marks the boundary where Solana takes over. Never used decoratively.

### Neutral
- **Terminal Black** (#0B0D10): The app background — a calm, near-black trading room. Also the text color on filled accent buttons.
- **Panel Slate** (#14171C): The single elevated surface tone for cards, panels, and rails. The only step up from the background.
- **Hairline** (#232A33): 1px borders and dividers. Structure without shadow spam.
- **High Ink** (#F5F7FA): Primary text, active values, headings.
- **Low Ink** (#97A0AF): Secondary text, labels, muted metadata.

### Named Rules
**The Semantic-Only Rule.** Green, pink, amber, and violet each carry exactly one meaning (up, down, halt, on-chain). A color never appears for flavor. If a green thing isn't "up / buy / winning / focus," it is a bug. **Two teams are told apart by ink brightness — home = High Ink, away = Low Ink — never by the green/pink price palette.**

**The One River Rule.** Visual boldness lives in the Momentum River and nowhere else. If a second element competes with the River for attention, the room is no longer quiet — subtract it. **Per-surface exception (Terminal):** the Terminal deliberately carries dense match context (Sofascore-style radar, ratings, attack, events) as a committed product decision. There the River stays the one bold *price* element, and supporting match-context charts are permitted — but rendered in neutral ink (home high, away low), never in the green/pink price palette, so they inform without competing for the price signal.

**The Direction-Is-Never-Color-Alone Rule.** Up/down is always reinforced with an arrow, sign, or position, never signalled by the green/pink pair alone. The market must read for color-blind users.

## 3. Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui fallback)
**Body Font:** Inter (with ui-sans-serif, system-ui fallback)
**Number/Mono Font:** IBM Plex Mono (with ui-monospace, Menlo fallback)

**Character:** Archivo brings weight and squared-off confidence to hero numbers and headings; Inter carries every label, control, and line of UI copy in a neutral, legible voice; IBM Plex Mono owns all numerics with tabular precision. The pairing sits on a real contrast axis — a heavy grotesque display against a humanist UI sans against a monospace — so nothing reads as "two similar fonts." Fixed rem-free sizes throughout; this is product UI viewed at consistent DPI, not fluid marketing type.

### Hierarchy — the enforced 6-step scale
Authored as Tailwind named steps (`text-{step}`), never arbitrary `text-[Npx]`. Nothing renders below 11px.
- **label** (11px / 1.4, +0.04em, often uppercase) → `text-label`: micro tags — H/D/A, "CR", "LIVE", "vol". The floor; 8/9/10px are retired.
- **caption** (12px / 1.45) → `text-caption`: secondary and meta text.
- **body** (13px / 1.5) → `text-body`: default UI text, team names, metadata. Prose caps 65–75ch; dense data runs denser.
- **strong** (14px / 1.45, weight set on the element) → `text-strong`: labels, buttons, active values.
- **heading** (Archivo 19px / 1.15, -0.01em) → `text-heading`: panel titles and match headers.
- **display** (Archivo 26px / 1.1, -0.01em) → `text-display`: big data numbers — open position, portfolio value, biggest movers.
- **display-xl** (Archivo 40px / 1, -0.02em) → `text-display-xl`: the big live match score only.
- **Mono**: IBM Plex Mono + tabular-nums layered on any step above — ALL numbers; prices always one decimal (61.4).

### Named Rules
**The Six-Step Rule.** Type comes from the named scale (`text-label` … `text-display`, plus `text-display-xl` for the score). Seven steps total, floored at 11px. An arbitrary `text-[Npx]` is drift, not nuance — snap it to a step.

**The Every-Number-Is-Mono Rule.** No number ever renders in Archivo or Inter. Prices, credits, clock, odds-as-price, P&L — all IBM Plex Mono, tabular-nums, so digits never jitter as they tick. Prices carry exactly one decimal (61.4).

**The 8pt Rhythm Rule.** Space on an 8pt grid with a 4pt sub-unit — `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`, nothing else. Apply it in two tiers: tight *within* a group (8/12), air *between* groups (24/32), a clear break *between* regions (48/64). Uniform padding everywhere is what reads as MVP; the rhythm is what reads as premium. Off-grid strays (6/10/14px, the `.5` half-steps) are retired.

## 4. Elevation

The system is neither flat nor shadow-heavy, and it is emphatically not glassmorphic. Depth is built from two moves layered together: a 1px inset top highlight that catches "light" on a panel's top edge, plus a soft ambient drop shadow so surfaces read as floating over the near-black background rather than as outlined boxes. Hairline borders (#232A33) do the rest of the structural work. Gradients and backdrop-blur are forbidden.

### Shadow Vocabulary
- **elev** (`box-shadow: inset 0 1px 0 0 rgba(245,247,250,0.03), 0 1px 2px 0 rgba(0,0,0,0.5), 0 12px 28px -16px rgba(0,0,0,0.9)`): The default resting elevation for cards, panels, and rails.
- **elev-hi** (`box-shadow: inset 0 1px 0 0 rgba(245,247,250,0.045), 0 2px 4px 0 rgba(0,0,0,0.55), 0 20px 44px -20px rgba(0,0,0,0.95)`): The lifted state — featured panels, the trade sheet, floating surfaces.

### Named Rules
**The No-Gradient, No-Glass Rule.** Depth is only ever tonal layering + the two `elev` shadows + hairline borders. The rgba black/white in the shadows is neutral ambient light, not palette color. If a surface leans on a gradient fill or a backdrop-blur to feel deep, it is wrong.

## 5. Components

### Buttons
- **Shape:** 8px radius (`rounded-lg`) on action buttons; a 6px inner radius on segmented toggles.
- **Primary action (Buy / Sell):** Filled with the semantic side color — Signal Green for buy, Signal Pink for sell — with Terminal Black text and a 44px minimum height (touch target). Padding is 20px horizontal. Buy and Sell are never the same neutral button recolored; the color *is* the action.
- **Hover / Active:** `filter: brightness(1.1)` on hover, `scale(0.99)` on active — a `transition-[filter,transform]` at 200ms ease-out. No color change on hover; the side color is fixed.
- **Focus:** 2px ring in the side's own color, 2px offset against the panel surface.
- **Side toggle:** A segmented Buy/Sell switch — `inline-flex` on a Terminal Black track with a hairline ring; the active segment fills with the side color and Black text, the inactive segment is Low Ink lifting to High Ink on hover.

### Chips (price cells)
- **Style:** Compact vertical cell — a Low-Ink micro-label (H/D/A) over a mono price in High Ink, on a translucent Terminal Black fill with a 1px inset hairline ring, 6px radius.
- **State:** The leading outcome is emphasized with a Hairline fill and solid hairline ring; on row hover the ring shifts toward Signal Green at 30% to preview interactivity.

### Cards / Containers
- **Corner Style:** 16px radius (`rounded-card`) — the signature soft-but-not-round panel corner.
- **Background:** Panel Slate (#14171C), the single elevated tone.
- **Shadow Strategy:** The `elev` shadow at rest; `elev-hi` when featured or floating (see Elevation).
- **Border:** 1px Hairline at ~70% for the quiet secondary rails.
- **Internal Padding:** 16px (lg), from the intentional spacing scale — never random Tailwind steps. Nested cards are forbidden.

### Credit Pill
- **Style:** A fully rounded (999px) pill on Panel Slate with a hairline ring, a glowing Signal Green dot, the mono balance, and a Low-Ink "CR" — the play-money balance, always credits, never a currency symbol.
- **State:** Hover shifts the ring toward Signal Green at 40%; active deepens the fill to Hairline.

### Navigation / Rows
- **Match row:** A dense, flat list row (10px × 12px padding) — favourite star, live minute, flags, team names, price cells. Transparent at rest; hover and focus-visible tint the background with Hairline at ~20%, active at ~35%, all via a 200ms color transition. The whole row is a single link to the market.

### Momentum River (signature component)
The one bold element. A live price line rendered with `lightweight-charts` (canvas, so it reads the resolved hex via `resolveColor`, not CSS vars), colored Signal Green when the market is climbing and Signal Pink when it falls. Numbers tied to it flash their direction for 180ms on each tick. Everything else on the page exists to stay out of its way.

## 6. Do's and Don'ts

### Do:
- **Do** keep every number in IBM Plex Mono with `tabular-nums`; render prices to exactly one decimal (61.4).
- **Do** spend all visual boldness on the Momentum River and keep every other surface quiet.
- **Do** use color semantically only — green up, pink down, amber for halts, violet for on-chain — and reinforce direction with an arrow, sign, or position, never color alone.
- **Do** distinguish two teams (radars, attack bars, ratings, home/away splits) with ink brightness — home = High Ink, away = Low Ink — never the green/pink price palette.
- **Do** build depth from tonal layering + the two `elev` shadows + 1px hairline borders.
- **Do** space on the 8pt grid (4/8/12/16/24/32/48/64) with a two-tier rhythm — tight within a group, air between groups; keep body prose to 65–75ch.
- **Do** author type from the named 6-step scale (`text-label` … `text-display`, `text-display-xl` for the score), never an arbitrary `text-[Npx]`; 11px is the floor.
- **Do** give every interactive element real hover, focus-visible, and active states, and a `prefers-reduced-motion` fallback for every animation.

### Don't:
- **Don't** look like a sportsbook — no neon casino felt, gold coins, flashing odds boards, or "BET NOW" urgency.
- **Don't** use the words bet, stake, odds, or wager in product copy. Say price, trade, credits.
- **Don't** use gradients, glassmorphism, or light mode (v1) — depth is tonal + hairline + `elev` only.
- **Don't** ship a generic SaaS dashboard of identical icon-heading-text card grids, or nest cards inside cards.
- **Don't** let the room get loud — if a second element competes with the River for attention, subtract it.
- **Don't** render a number in Archivo or Inter, and never show a price with more than one decimal.
- **Don't** use off-grid spacing (6/10/14px, the `.5` half-steps) or an arbitrary `text-[Npx]`; snap to the 8pt grid and the named type scale.
- **Don't** use amber or violet decoratively; amber means halt, violet means on-chain, nothing else.
- **Don't** color team identity, status pills, or "hot" values green or pink — those mean price up/down only; use neutral ink instead.
