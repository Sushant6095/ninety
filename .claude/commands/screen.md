---
description: Build or refine one screen in the ui-craft loop (screenshot → design-cop → fix → repeat).
---
Screen: $ARGUMENTS

Invoke the **ui-craft** skill first — it is the law for this command. Supports two flags:

- `--plan` — planning only. Read the screen's row in `design/SCREEN-DATA-MAP.md` + its
  `design/screens/` reference crop, then LIST the primitives to build (prefer 21st.dev/shadcn
  copy-ins) and the exact data hooks (REST/WS) it needs. Write NO code. Stop for review.
- `--repair <route>` — no building. `node scripts/ui/screenshot.mjs <route> <name>` → run the
  **design-cop** agent against the matching `design/screens/` crop → fix each numbered gap →
  re-shoot → repeat to all-PASS. Use on an existing screen that regressed.

Default flow (build/refine):
1. Read the matching `design/screens/` reference crop + the screen's `design/SCREEN-DATA-MAP.md`
   row (primary reference app, REST cold, WS hot, chain surface) + any `apps/web/src/features/*`
   README.
2. Build ONE component or state at a time — tokens only (`src/design/tokens.ts` /
   `src/design/motion.ts`), fully typed, composing primitives — wired to REAL replay data per the
   data map (never lorem). Build missing primitives first.
3. `node scripts/ui/screenshot.mjs <route> <name>` → sm/md/lg/xl into `design/screens/impl/`. VIEW them.
4. Run the **design-cop** agent vs the reference crop. Fix each numbered gap, naming its target.
5. Loop step 3–4 until design-cop all-PASS at 4 breakpoints, or 6 iterations then escalate.
6. Close: `/adr` any decision made, update `.claude/context/NOW.md`, `/ship`. Never end on red; never push.
