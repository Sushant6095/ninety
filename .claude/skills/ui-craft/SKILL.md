---
name: ui-craft
description: The authoritative skill for ALL frontend work in apps/web — building or refining any screen, component, chart, or micro-interaction for the OMNIPITCH exchange. Use whenever you touch apps/web UI. Owns the subtract-then-elevate principle, the reference blend (Polymarket spine / Hyperliquid feel / Sofascore depth-in-tabs), the Momentum River hero, the screenshot→design-cop loop, the token/motion/library laws, and the definition of done.
---

## §0 — THE ROUTER (read FIRST, every time)

**You do not decide which tool to use. You look it up. One row, one tool.** ui-craft is the most
reliably-triggered skill, so it is the dispatcher. Before building anything, find your row.

| I am building… | Route to | Never |
|---|---|---|
| **Generic primitive** — dialog, tabs, tooltip, popover, accordion, hovercard, scroll-area, form | **radix-ui / shadcn MCP** — already installed, already in 7 files. Re-skin to tokens. | Hand-rolling. Re-fetching what you have. |
| **Animated candy** — tickers, number-rolls, marquees, shimmer, bento, reveals | **magicui MCP** (Framer-based, drops straight in) | Hand-rolling a number ticker |
| **Finished product surface** — nav, hero, pricing-grade layout | **21st.dev MCP** — **RATE-LIMITED: 2 get_component pulls/day.** Surgical only, for what shadcn + magicui cannot give. | Over-pulling and burning the quota |
| **Layout accents** | **OriginKit MCP** — skews WebGL demo-ware. Any WebGL piece falls under the 3D quarantine (§7). | Putting an OriginKit shader near the tape |
| **Interaction feel** — hover, press, focus, "why does this feel cheap" | **emil-design-eng skill** + **framer-motion** | Guessing at easing |
| **Choreographed sequence** — the halt, celebration, Moment reveal, River draw-on, scrollytelling | **gsap-core/timeline/scrolltrigger/react skills** → GSAP via `src/lib/gsap.ts` (ADR-052) | framer-motion for multi-step timelines |
| **UI state motion** — enter/exit, layout, tick-flash | **framer-motion** | GSAP for simple state |
| **Page choreography** | **page-load-animations skill** | Everything appearing at once |
| **Any chart** | **dataviz skill FIRST**, then **lightweight-charts** | Writing a chart blind |
| **Any image** | **next/image**, always, explicit width/height | `<img>`. Zero exceptions. |
| **Taste / anti-slop check** | **design-taste-frontend skill** | Shipping something that reads AI-generated |
| **3D / shader** | `/how-it-works` + landing hero ONLY. Lazy-loaded. | Anywhere near a live price |
| **Football-product structure** — tabs, what a fan expects | **`docs/sofascore-research/`** (29 files). Chrome MCP only to fill a gap it doesn't cover. | Taking their colours (light-mode). Re-scraping. |
| **Ninety-specific** — MomentumRiver, MatchCard, PriceChip, trade ticket, ProofBadge, Booth | **Hand-build.** No registry has these. | Wasting a search |
| **Library API question** | **context7 MCP** | Writing the API from memory |
| **A11y** | **axe-core** (installed) + `a11y-architect` agent | Waiting for design-cop to catch it |
| **Assembling components** | **frontend-composer** agent | Hand-rolling primitives |
| **Every screen, last** | **design-cop** → **a11y-architect** → **MotionScore** | "Looks fine" |

**Every non-Ninety component in a diff needs a `design/PROVENANCE.md` row** (Component · Router row · Tool
called · Searched incl. misses · Sofascore ref · Re-skinned · Shot). No row = not done. `hand-rolled` is legal
ONLY for the six Ninety pieces, and only with the searches logged. design-cop criterion 12 enforces this.

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
re-skinned to tokens) + **lightweight-charts** (the ONLY chart lib) + **Framer Motion** and **GSAP**
(the two sanctioned animation libs — see the split below) + **Lucide** icons + **Sonner** toasts.
- **Two animation libs, one split (ADR-052).** **Framer Motion** for micro-interactions: price flash,
  number rolls, badge pulse, reveals, sheet/tooltip/dialog enters. **GSAP** for HEAVY choreography:
  the River stroke draw (DrawSVGPlugin), how-it-works scrollytelling (ScrollTrigger/ScrollSmoother),
  hero text (SplitText), complex timelines. Both obey the motion tokens — import gsap + useGSAP from
  **`lib/gsap.ts`** (defaults pinned to the token ease), animate transform/opacity only, honor
  `prefers-reduced-motion` (`gsap.matchMedia`), and never animate one element with both libs.
- **Third-party primitives are the DEFAULT for generic UI** — dialog, tabs, tooltip, sheet,
  command (⌘K), scroll-area, popover, dropdown, accordion. Pull them in from a sanctioned MCP-connected
  source — **shadcn/ui**, **21st.dev**, or **Magic UI** (`@magicuidesign/mcp`, animated components on
  framer-motion) — and **RE-SKIN TO TOKENS**. Hand-building a generic primitive is a
  DEFECT. The token law applies to the OUTPUT, not the moment of import — an imported component is
  compliant once its colors, spacing, radius, and motion all trace to the token system.
- **Hand-build ONLY the Ninety-specific pieces** no library has: the Momentum River, MatchCard,
  PriceChip, the trade ticket, ProofBadge, and the Booth. Those are the product; everything
  generic around them is assembled from re-skinned primitives, never re-invented.
- **React Flow** is allowed on EXACTLY ONE route — the how-it-works / proof-flow page —
  lazy-loaded, never in the shared bundle (see the `proof-flow-viz` skill).
- **WebGL / 3D is ALLOWED (ADR-053).** `@shadergradient/react` + `@react-three/fiber` + `three`
  (+ `three-stdlib`, `camera-controls`) are sanctioned for ambient/hero visuals — shader-gradient
  backdrops, the North Star surface, hero scenes. Discipline (not a ban, but hold it): lazy-load
  (`next/dynamic`, `ssr:false`), keep it OFF the live trading hot path so the River/tape stay
  jank-free (MotionScore flagged GPU pressure at B), pause/teardown under `prefers-reduced-motion`
  and when offscreen, and watch the GPU-layer/texture budget. Spline stays out (proprietary + heavy).
- **Impeccable is the CI anti-slop gate.** It enforces universal design-quality rules; on any
  conflict, **ui-craft's tokens and the trading-terminal domain WIN** — dark theme, mono numbers,
  and the amber/violet accent tokens are whitelisted as intentional (a financial terminal, not a
  SaaS landing page). Treat an Impeccable failure as a REAL gap to fix UNLESS it flags a
  whitelisted token. Config: `impeccable.config` at repo root.
- **Banned:** MUI / Chakra / Ant / Mantine, CSS-in-JS runtimes, Lottie, video backgrounds, any
  SECOND chart library, and any animation lib beyond the two sanctioned ones (Framer Motion + GSAP).

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
states · a11y · copy · consistency · elevation · feeling (ADR-049) — on real replay data, with
the hot path free of re-render storms (`series.update()` only, no prop-churn on the tape). Not
"looks fine," and not "merely matches the reference" — the reference is INTENT, so a passing
screen elevates on it and creates delight. Rubric-green, or it isn't done.
