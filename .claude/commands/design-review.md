---
description: Score the current screen against its design reference without building or fixing anything.
---
Screen / route: $ARGUMENTS

A read-only judging pass — no code changes.
1. `node scripts/ui/screenshot.mjs <route> <name>` → capture sm/md/lg/xl into `design/screens/impl/`.
2. VIEW all four breakpoints.
3. Run the **design-cop** agent against the matching `design/screens/` reference crop.
4. Report design-cop's output verbatim: PASS/FAIL per rubric line + the numbered gap list.

Do NOT fix anything — this command only tells you where the screen stands. Use `/screen --repair
<route>` to actually close the gaps.
