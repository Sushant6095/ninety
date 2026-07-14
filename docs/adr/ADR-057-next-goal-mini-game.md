# ADR 057 Next Goal — the halftime mini-game (`/play`), a pure read-only consumer

Status: accepted 2026-07-14 (`feat/games`). Cross-ref: ADR-050 (consumer layer — the game reads the ONE store, writes nothing), ADR-051/054/055 (two-source rule + the money-shot SSOT: the game reads the store's MOVING fields, reads MATCH's STILL fields), ADR-052 (GSAP is the sanctioned lib for the heavy win choreography, alongside Framer Motion for micro-interactions). New territory: `apps/web/src/features/games/` + `apps/web/src/app/play/`.

Context: a fan taps this at halftime with zero explanation — "who scores the next goal?" — and it must be legible in 2 seconds. The value is 4 seconds: ~3s of decision tension (a countdown that IS the tension) and ~1s of payoff when the goal lands. It is free to play, play-money-invariant (no deposits, no payouts — ADR laws), and it must NEVER become a second writer of match state. The exchange stays quiet; this is the ONE place boldness lives, but it stays inside the token system.

## What Next Goal is
A React component at `/play` that watches the featured live match (`TERMINAL_MATCH_ID` = Australia v Egypt, seeded goalless at 74'). The player makes a **pick** (Home / Away — the two teams, big and instantly legible), a ~3s countdown locks it, and the round resolves when the next goal lands. Two picks only: a third "no goal" pick was considered and dropped — the two flags/codes read in a glance, an abstract third button dilutes the snap decision. "No goal this window" survives as a resolution *outcome* (NO_CALL), not a pick.

## The state machine (the one idea kept from game-developer — everything else in that skill was engine-only and discarded)
`READY` → `PICKING` (a side chosen, countdown running, still changeable) → `LOCKED` (committed, awaiting the goal) → `RESOLVING` (a delta observed or the window elapsed) → `WON | LOST | NO_CALL` → back to `READY`.
- READY→PICKING: tap a side. PICKING→PICKING: tap the other side (switch — the countdown keeps running, the tension does not reset). Re-tap the chosen side = express lock now.
- PICKING→LOCKED: the 3s countdown reaches zero (or express lock). `lockScore` is captured here.
- LOCKED→RESOLVING: a score delta appears, OR the resolve window (2200ms) elapses.
- RESOLVING→WON/LOST/NO_CALL: a ~180ms goal-flash beat, then the verdict paints.
- terminal states → READY: on "Go again", which rewinds the demo match to its seed.

## READ-ONLY contract (hard line: the GAME never writes match state)
- The game reads live state ONLY through `useMatchLive(TERMINAL_MATCH_ID)` (`{status, score, minute, phase, prices}`) and the STILL team metadata from `lib/terminal` `MATCH` (names/codes/flags — the stillness source per ADR-051). It imports ZERO store writers.
- **Resolution mechanism:** while `LOCKED`, the hook compares `live.score` against the `lockScore` captured at lock. `score.home > lockScore.home` → a home goal; `score.away > lockScore.away` → an away goal. Goal for the picked side → WON; for the other side → LOST; window elapses with no delta → NO_CALL (no penalty). Deltas are only evaluated while `LOCKED`, so drift/minute ticks (which never touch score) can never spuriously resolve a round.
- The game logic never calls `setScore`/`setMatchStatus`/`repriceMatch`/`driftTick`/`rewindMatch` and never touches `apps/api`/the engine. It is a pure consumer.

## Goal-source decision (how a goal actually fires without the game fabricating one)
The match simulation stays store-owned. `/play` needs a goal on demand for a playable loop, so the PAGE (not the game) runs a thin harness — `app/play/matchSimHarness.ts` `useMatchSimHarness()` — that is the stand-in for the live WS feed. It is the ONLY thing in `/play` that writes match state, and it writes only through the store's OWN writers (`rewindMatch` → `repriceMatch` + `setScore` — the exact writers `useHaltSequence`/`FeaturedPanel` already use to land the money-shot goal). Wiring:
- The game emits plain UI lifecycle callbacks (`onLock`, `onReset`) — these are round events ("the player locked"), NOT match state. The game holds no reference to the harness or to any writer.
- `onLock` → the harness schedules a goal 700–1500ms later. It is **pick-blind** (it simulates a feed that doesn't know your pick): ~15% no goal (→ NO_CALL), else home/away on a fair coin, via `setScore` + a matching `repriceMatch` so the market visibly ticks. Max fire (1500ms) sits inside the game's NO_CALL window (2200ms).
- `onReset` → `rewindMatch(TERMINAL_MATCH_ID)` restores the 0–0 / 74' seed for the next round; the harness also rewinds on unmount so leaving `/play` never strands the shared match at 1–0.
- Swapping to a real feed = delete the harness. The game code does not change — that is the proof it is read-only.
- Known, contained simplification (ponytail): the harness mutates the shared `TERMINAL_MATCH_ID` SSOT that `/terminal` and `/board` also read; per-round + on-unmount rewinds keep it consistent, and a user on `/play` is not viewing those surfaces simultaneously. Upgrade path if that ever matters: a dedicated store-seeded demo match id.

## Reward loop
Earned, not automatic. BASE 100 points × a streak multiplier `min(3, 1 + (streak-1)·0.5)` (1×/1.5×/2×/2.5×/3× cap). A 3-streak escalates over a 2 — more light beams, more scale, more stagger, brighter glow (celebration tier derived from streak). WON: streak++, points += award, best = max(best, streak). **LOST never punishes**: points are kept, streak soft-resets to 0, copy says "So close." — quiet, muted, slow. NO_CALL: nothing changes, "No goal that window — streak safe."

## Copy + persistence + stack (locked)
- Copy law: vocabulary is **pick · call · streak · points**. NEVER bet / stake / odds / wager. Free to play.
- Persistence: **localStorage ONLY** (`ninety.nextgoal.v1` → `{points, streak, best}`). No accounts, no backend.
- Stack lock: React + Tailwind tokens + Framer Motion (state/micro-interactions) + GSAP (win choreography, imported from `lib/gsap`). NO new dependencies. NO Phaser/matter.js/PixiJS/Three.js/canvas game loop/physics/render loop — Next Goal is a React component, not a game engine. Tokens/CSS-vars only, zero raw hex. `prefers-reduced-motion` drops all movement (countdown, beams, pops) and keeps opacity/color.

Consequences / VERIFY: `tsc --noEmit` clean; no new deps (`apps/web/package.json` unchanged); reduced-motion honored via `useReducedMotion` + `gsap.matchMedia`. Files: `apps/web/src/features/games/*` (read-only game), `apps/web/src/app/play/*` (page + feed harness).
