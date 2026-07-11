---
name: component-picker
description: Use for EVERY frontend component task in apps/web. This skill decides which third-party primitive to pull, from which source, and how to re-skin it to Ninety tokens. The agent assembles from primitives first and hand-builds only Ninety-specific components. Triggers whenever a UI element, component, or screen part needs building.
---

# component-picker — assemble, don't invent

You build Ninety's UI by ASSEMBLING re-skinned third-party primitives, not by hand-rolling
common components. Reach for a primitive first; compose second; hand-build ONLY what is
genuinely Ninety-specific. Your judgment is: for each element, pick the RIGHT source, pull
it, re-skin it to tokens, compose it.

## THE SOURCES (query these; know what each is for)
- shadcn (MCP: `npx shadcn@latest mcp`) — PRIMARY primitive source. Accessible plumbing:
  dialog, sheet, tabs, dropdown, tooltip, command (⌘K), popover, skeleton, select,
  accordion, slider, switch, scroll-area. Pull liberally. This is your default.
- 21st.dev — pre-DESIGNED component PATTERNS (fancier cards, hero sections, nav layouts).
  Use when you need a starting layout, not just a primitive. Copy-in, re-skin.
- Emil Kowalski skills (emilkowalski/skills) — INTERACTION CRAFT. Consult for HOW motion
  and micro-interactions should feel (the toast, the sheet drag, the reveal). Craft layer
  on top of Framer Motion — not a component source, a feel source.
- taste-skill (Leonxlnx) — TASTE JUDGMENT. Consult to sanity-check whether a built
  component looks premium or generic. A second opinion alongside design-cop.

## SELECTION LAW (how to choose per element)
1. Is it standard interactive plumbing (modal, dropdown, tabs, slider, command palette,
   toast, tooltip)? → PULL FROM SHADCN. Never hand-build these; shadcn's are accessible
   and battle-tested.
2. Is it a richer composed layout (a fancy card, a nav shell, a section)? → check 21st.dev
   for a pattern to adapt, else compose from shadcn primitives.
3. Is it Ninety-SPECIFIC (the Momentum River, PriceChip, MatchCard, the trade ticket, the
   ProofBadge, the Booth bubble)? → HAND-BUILD it, composing shadcn primitives inside, on
   lightweight-charts + Framer Motion. No library ships these; they are your product.
4. Is it motion/interaction feel? → consult Emil's skills for the craft, implement in
   FRAMER MOTION (the only animation lib — never add anime.js or a second animation engine).

## RE-SKIN LAW (mandatory — the step that prevents slop)
EVERY pulled component is re-skinned to Ninety tokens BEFORE it ships:
- Colors → CSS vars only: --bg #0B0D10, --surface #14171C, --hairline #232A33, --up #2BD97C,
  --down #FF3D81, --halt amber (halts only), --chain violet (on-chain only), --text-hi
  #F5F7FA, --text-lo #97A0AF.
- Fonts → Archivo (display), Inter (UI), IBM Plex Mono (numbers, tabular-nums).
- Radius/spacing → the token scale. No arbitrary values.
- Default states → replace with Ninety hover/focus/active/disabled.
NEVER ship a component in its default look. The stock shadcn zinc theme IS the generic-AI-app
look we are avoiding. shadcn = skeleton, Ninety tokens = skin. On conflict, tokens win.

## LIBRARY BANS (do not pull or add)
Second chart lib (lightweight-charts is the only one). Second animation lib (Framer Motion
is the only one — NO anime.js). Themed component kits (MUI/Chakra/Ant/Mantine). CSS-in-JS
runtimes. Lottie/video backgrounds. Adding any of these needs an ADR.

## THE FLOW (per component)
1. Identify the element and its selection category (1–4 above).
2. Pull from the right source (query the MCP / copy the pattern), or decide to hand-build.
3. Re-skin to tokens completely.
4. Add the four interaction states + Framer Motion feel (Emil's craft where it matters).
5. Screenshot (scripts/ui/screenshot.mjs) → design-cop + taste-skill judge → fix gaps.
6. Compose into the screen against the design/screens/ reference.

## DONE
The component uses a re-skinned third-party primitive where one existed, is hand-built only
where Ninety-specific, is fully tokenized (zero default styling), has all four states +
appropriate motion, and passes design-cop against the reference.
