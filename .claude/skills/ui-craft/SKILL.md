---
name: ui-craft
description: The authoritative skill for ALL frontend work in apps/web — building or refining any screen, component, chart, or micro-interaction for the OMNIPITCH exchange. Use whenever you touch apps/web UI. Owns the subtract-then-elevate principle, the reference blend (Polymarket spine / Hyperliquid feel / Sofascore depth-in-tabs), the Momentum River hero, the screenshot→design-cop loop, the token/motion/library laws, and the definition of done.
---

# ui-craft — the OMNIPITCH frontend law

## 1. CORE PRINCIPLE — subtract, then elevate
Premium UI shows ONE thing beautifully and hides the rest. OMNIPITCH's failure mode is the
kitchen sink: prices + lineups + referee + managers + H2H + stats + media all at equal weight
is a *stats site*, not an *exchange*. Every screen has exactly ONE hero; everything else is
quiet, secondary, or tabbed away. Density is fine — density *without hierarchy* is noise.
Before adding an element, ask what it demotes. If nothing, it doesn't belong on the primary
surface.

## 2. THE BLEND (per screen)
Do not copy one app wholesale. Blend deliberately:
- **Home / discovery → Sofascore.** Scannable list of live/upcoming matches, momentum at a glance.
- **Match view SPINE → Polymarket.** The vertical is outcome → probability → chart → trade.
  NOT score → stats → lineups. The market is the subject; football is context.
- **Match view LIVE feel → Hyperliquid.** Dark, calm, fast. The chart dominates. Prices
  tick-flash on change. A tight, always-ready order panel. No visual noise competing with the tape.
- **Trade sheet → Hyperliquid.** Compact, instant, one decision.
- **Portfolio → Polymarket.** Positions as outcomes with current probability + P/L.
- **ALL football depth (lineups, stats, H2H, managers, referee, media) → Sofascore, INSIDE tabs.**
  This is the release valve for density: rich, but never on the primary surface.

## 3. THE MOMENTUM RIVER IS THE HERO
On the LIVE match view the River occupies **≥45% of viewport**. It is the one place all visual
boldness lives. Built on lightweight-charts, driven by `series.update()` only (never full
re-render), a 0–100 probability axis over a 90-minute domain, with event glyphs at goal/red
minutes and an amber halt overlay during halts. It is NEVER a corner sparkline. See the
`momentum-river` skill for the chart specifics.

## 4. THE LOOP (how every screen converges)
Build ONE component, then:
`node scripts/ui/screenshot.mjs <route> <name>` → shots at sm/md/lg/xl into `design/screens/impl/`
→ VIEW them → run the **design-cop** agent against the matching `design/screens/` reference crop
→ fix each numbered gap, naming the target it's failing → repeat until all-PASS or 6 iterations,
then escalate to the human. The loop owns correctness; the human owns taste. Never call a screen
done off a single pass or "looks fine."

## 5. OPERATING RULES
a. **Tokens only.** No arbitrary Tailwind — never `bg-[#…]`, never `p-[13px]`. Values come from
   the token system (§6). A raw value is a bug.
b. **One component, one focus.** Fully typed. Compose primitives; don't grow god-components.
c. **Every breakpoint, every iteration.** Optimize sm/md/lg/xl each pass — mobile is not an afterthought.
d. **Every state, same iteration.** hover / focus-visible / active / disabled on every interactive
   element, plus loading / empty / error where data flows. Motion 150–250ms on transform/opacity
   only; honor `prefers-reduced-motion`.
e. **Real replay data, never lorem.** Prices one-decimal, IBM Plex Mono, tabular-nums.

## 6. TOKENS & TYPE — the single source of truth
Import from **`src/design/tokens.ts`** (colors, fonts, spacing, radius) and
**`src/design/motion.ts`** (flash / transition / easeOut / spring). Those two files are the
authority — this skill does NOT restate any value; point components and the judge at them.
- Palette semantics you must respect: the **amber** token is for **halts only**; the **violet**
  token is for **on-chain UI only** (ProofBadge, Solscan, mint sigs). Using either decoratively
  is a design-cop FAIL.
- Fonts: **Archivo** display / **Inter** UI / **IBM Plex Mono** numbers (tabular).
- Copy: sentence case, plain verbs. NEVER the words bet / stake / odds / wager / gamble — say
  price, trade, credits.

## 7. LIBRARY LAW
**CORE stack:** Next / React / TypeScript + Tailwind (tokens only) + shadcn/ui (copied in and
re-skinned to tokens) + **lightweight-charts** (the ONLY chart lib) + **Framer Motion** (the ONLY
animation lib) + **Lucide** icons + **Sonner** toasts.
- **21st.dev is a sanctioned copy-in source**, re-skinned to tokens. PREFER 21st.dev / shadcn
  primitives over hand-rolling common components.
- **React Flow** is allowed on EXACTLY ONE route — the how-it-works / proof-flow page —
  lazy-loaded, never in the shared bundle (see the `proof-flow-viz` skill).
- **Spline / WebGL / any 3D is FORBIDDEN in the app** — GPU contention breaks the 150ms
  tick-to-pixel path, and it reads as demo-ware.
- **Impeccable is the CI anti-slop gate.** It enforces universal design-quality rules; on any
  conflict, **ui-craft's tokens and the trading-terminal domain WIN** — dark theme, mono numbers,
  and the amber/violet accent tokens are whitelisted as intentional (a financial terminal, not a
  SaaS landing page). Treat an Impeccable failure as a REAL gap to fix UNLESS it flags a
  whitelisted token. Config: `impeccable.config` at repo root.
- **Banned:** MUI / Chakra / Ant / Mantine, CSS-in-JS runtimes, Lottie, video backgrounds, and
  any SECOND chart or animation library.

## 8. MICRO-INTERACTIONS — where premium lives
Small, precise, motion-token-driven: price flash on change; number roll via Framer Motion
`animate` + `useMotionValue` (not a new dependency); halt sweep across the market; a
position-badge pulse on fill; the ProofBadge reveal on settle; the goal-cliff on the River.
These are the difference between "functional" and "premium" — they are not optional polish.

## 9. SCREEN → DATA WIRING
Screens render frames — they never poll and never compute prices themselves. The full mapping
lives in **`design/SCREEN-DATA-MAP.md`**; consult the target screen's row before building.
- REST (cold): `GET /markets`, `GET /markets/:match` (returns `{status, mark, amm:{q, b, spread_mult}}`
  so the client can price locally between ticks), `GET /auth/me`.
- WS (hot): `m:{match}:prices`, `m:{match}:events`, `m:{match}:booth`, `lb:global`.
- The ONLY chain surface in the app is the **ProofBadge → Solscan** on a SETTLED market (violet).

## 10. DEFINITION OF DONE
design-cop **all-PASS** across its rubric — hierarchy · tokens · restraint · blend · motion ·
states · a11y · copy · fidelity — at all four breakpoints, on real replay data, with the hot
path free of re-render storms (`series.update()` only, no prop-churn on the tape). Not "looks
fine." Rubric-green, or it isn't done.
