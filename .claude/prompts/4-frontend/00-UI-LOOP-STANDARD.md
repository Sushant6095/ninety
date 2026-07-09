# UI-LOOP STANDARD — paste beneath every screen prompt

Every apps/web screen prompt runs under these seven rules. Invoke the **ui-craft** skill; it is
the authority for all of them.

1. **Don't invent UI.** Build against the `design/screens/` reference crop and the `design/SCREEN-DATA-MAP.md`
   row. No screens, modules, or features that aren't in the reference. Match, don't improve.
2. **One component at a time.** Build/refine a single component or state per step, fully typed,
   composing primitives (prefer 21st.dev / shadcn copy-ins, re-skinned to tokens).
3. **No guesswork — screenshot every change.** `node scripts/ui/screenshot.mjs <route> <name>`
   (sm/md/lg/xl → `design/screens/impl/`), VIEW, then judge with the **design-cop** agent. Never
   assume it looks right.
4. **Interactive immersion.** hover / focus-visible / active / disabled on every interactive element,
   plus loading / empty / error, in the SAME iteration. Motion 150–250ms on transform/opacity only,
   `prefers-reduced-motion` honored.
5. **Libraries per the law.** Core stack only (Next/React/TS, Tailwind tokens-only, shadcn,
   lightweight-charts, Framer Motion, Lucide, Sonner). React Flow only on how-it-works. No 3D, no
   second chart/animation lib, no banned UI kits. Impeccable is the CI gate; ui-craft tokens win on conflict.
6. **Real data per the data map.** Wire to real replay data through the REST/WS hooks in
   `design/SCREEN-DATA-MAP.md`. Never lorem. Prices one-decimal, IBM Plex Mono, tabular.
7. **Performance: tick → pixel.** The hot path updates via `series.update()` only — no full
   re-render, no prop-churn on the tape, no re-render storms.

**DONE** = the **design-cop** agent returns all-PASS on its full rubric at all four breakpoints,
on real replay data. Not "looks fine" — rubric-green.
