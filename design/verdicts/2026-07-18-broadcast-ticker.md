# design-cop verdict — REBUILT top ticker (broadcast strap, ADR-080)

- **Date:** 2026-07-18 · Branch: `merge/live-integration`
- **Surface:** `apps/web/src/features/home/Ticker.tsx` — the shared top strap on **/board** and **/terminal**.
- **Data:** real football-data.org fixtures (comp 2000) via new `GET /rich/fixtures/:competition` (ADR-080);
  pinned real snapshot `data/wc26/broadcast-fixtures.json`, live path `getFixtures()` (confirmed 200 locally).
- **Shots looked at:** board-1440, terminal-1440, board-1280, wide-8chip-1440, board-final-1440.

> Persisted by the parent agent, from the design-cop subagent (read-only). Round 1 = PASS-WITH-NOTES; the two
> actionable chrome-a11y notes are now fixed (round-2 disposition below).

## Verdict: **PASS-WITH-NOTES → two a11y notes closed**

Ships. Lines 1–5, 8–12 PASS; line 10 beats the reference. Nothing FAILs. The two PASS-WITH-NOTES lines (6 STATES,
7 A11Y) are on non-primary chrome and are now addressed.

## Rubric (12 lines)
1 HIERARCHY PASS (three real tiers — team names UI-sans semibold, ONLY numbers `.num`+tabular, day/stage labels 11px caps-tracked `text-lo`; the rebuild's whole point, delivered) · 2 TOKENS PASS (no raw hex; LIVE `--up`, HALT `--halt`, prices 1-decimal, 180ms LivePrice tick-flash kept on live chips) · 3 RESTRAINT PASS (schedule/result/live glance only; removed the old mono clutter) · 4 BLEND PASS (strap chrome, links into the trade surface) · 5 MOTION PASS (marquee `translateX` linear, ONLY on overflow, pause-on-hover, off the tick hot path; reduced-motion → static scrollable) · 6 STATES PASS *(active press added)* · 7 A11Y PASS *(coarse-pointer 44px target added)* · 8 COPY PASS (no bet/stake/odds/wager; "No fixtures in this window.") · 9 CONSISTENCY PASS (terminal identical to board — one shared component) · 10 ELEVATION PASS — beats the reference (mono terminal dump → broadcast strap) · 11 FEELING PASS (flags flanking real names + stage tag = a TV lower-third bug) · 12 PROVENANCE PASS.

## Read-out-loud (clean, no contradiction)
`WC26` (grey dot — `hasLive=false`, nothing in play) · **WED 15** England 1–2 Argentina · SEMI-FINAL · FT ·
**TODAY** 21:00 France v England · 3RD PLACE (no score, "v" — correct for upcoming) · **TOMORROW** 19:00
Spain v Argentina · FINAL. Every minute/score/kickoff/day-label/stage agrees with football-data and each other.
No "LIVE 86' next to a tomorrow fixture" anywhere (checked the 11-chip dense case too — all FT results, grouped
FRI 12 / SAT 13). LIVE segment honestly empty (ADR-080 §3).

## Two-source law (ADR-051) — CONFIRMED clean
`Chip` reads `minute/halted/liveScore/prices` ONLY from `useMatchLive(chip.matchId)` gated on `isLive`;
`toChip` sets `homeScore/awayScore` null unless `kind==="result"`. A live chip's minute/score/price can only come
from the TxLINE/replay store — football-data supplies schedule + FINAL results only. No mixing on any row.

## Round-1 notes → round-2 disposition
- **[FIXED · line 7 A11Y] Chip hit target ~30px < 44px** → added `pointer-coarse:min-h-11` (verified in built CSS:
  `@media (pointer: coarse){ min-height: 2.75rem }`) — 44px on touch, thin strap on desktop.
- **[FIXED · line 6 STATES] No `active:` press** → added `active:bg-surface/90` on the chip Link.
- **[FIXED · line 10 polish] Bare live price** → live chip now prints the lead outcome letter before the price.
- **[LOW, left] Arbitrary `shadow-[0_0_5px_var(--up)]` / `h-[18px]`** — colour is tokenized and 18px matches the
  Flag size constant; promote to named `--glow-up` / a shared flag constant later. Not a hex/spacing violation.
- **[NOTE, left] "FT" carries `.num`** — intentional broadcast convention (monospaced result tag).

## Sparsity + states — CONFIRMED
3 chips → centered (`justify-center`, not stretched); 1280 → marquee loops cleanly; 11 chips → marquee holds on
one line, no wrap. Skeleton loading + honest empty + error→baked-snapshot fallback; never invents matches.

**Bottom line: PASS.** Real data, correct two-source separation, genuine typographic hierarchy, honest sparsity;
both actionable a11y notes closed and verified.
