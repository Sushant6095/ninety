# ADR 056 The landing owns `/` — the board moves to `/board`

Status: accepted 2026-07-14 (`merge/live-integration`). Extends: ADR-043 (the locked board screen is unchanged, now served at `/board`; back-linked there). Cross-ref: ADR-050 (renders through the one AppShell), ADR-052 (GSAP hero River draw), ADR-053 (shader slot deliberately left empty — see below).

Context: the link previously dropped judges straight onto the dense board. `.claude/prompts/4-frontend/LANDING.md` commissioned a landing informed by `docs/hyperliquid-research/hyperfoundation/` — structure and restraint ONLY, zero Hyperliquid hex/copy/markup.

Decision:
- Routes: `routes.home` stays `/` (the landing — where a visitor arrives); `routes.matches` + new `routes.board` = `/board` (where a trader goes). Every board-intent link (TerminalHeader WC26/Live/Today subnav + badge + active states, StubScreen, MomentsGallery, how-it-works hero CTA, LeaderboardPage, PortfolioPage) repointed to `routes.matches`; sign-out and the wordmark deliberately keep `routes.home`.
- Landing structure (hyperfoundation restraint law): thesis hero with the River motif drawing itself (GSAP, ADR-052) → the loop shown by embedding the REAL `FeaturedPanel` + `useHaltSequence` (mounted on scroll into view) → one giant mono number (61.4) → violet on-chain proof chapter (the page's ONLY chain surface) → headline-less numbers band (magicui NumberTicker re-skinned to tokens) → closing CTA repeating the hero's pair verbatim. ONE filled CTA on the whole page — repeated, not multiplied.
- The ADR-053 shader slot in the hero is DELIBERATELY empty: MotionScore already grades texture memory at B and the LANDING DoD requires cutting the shader before shipping an S-grade regression that cannot be re-verified in-session; the drawn River is the hero's atmosphere. Revisit only with a fresh MotionScore run.

Consequences / VERIFY: `tsc` clean; axe 0 violations on `/` and `/board`; all 15 routes 200. Files: `apps/web/src/features/landing/*`, `apps/web/src/app/page.tsx`, `apps/web/src/app/board/page.tsx`, `apps/web/src/lib/routes.ts`, `scripts/ui/axe.mjs` (+ `/board` route).
