# Ralph verdict — LANDING FULL-PAGE (clean landing pass #1) + LandingFinale (pass 12)

- **Date:** 2026-07-19 · Anchor: real Sofascore captures + mechanical slop taxonomy (NOT bare-DOM HL, B5)
- **Full-page composites:** `composites/2026-07-19-landing-fullpage-dark-light.png` (DARK | LIGHT),
  `composites/landing-full-dark.jpg`, `composites/landing-full-light.jpg`
- **Finale composite:** `composites/2026-07-19-finale-vs-sofa.png`

## LandingFinale (section 9) — NO SLOP, no change.
The ADR-085 close: two drifting parallax bands of SAFE baked national crests (`/teams/{id}/badge.png`, ADR-055 —
NOT player photos, so NO B6; the author's comment explicitly rejected the dubious "stadium.jpg" poster), a token
floodlight glow, a theme scrim + halo (wordmark reads in both themes), the giant NINETY wordmark, clean copy
("Every World Cup match, priced live. Play money, proven on-chain." — no em-dash), both CTAs, a grass/touchline
foreground. Tokens only, `.pfin-track` parallax gated by `prefers-reduced-motion`, landing-only. S1–S10 = 0.

## FULL-PAGE READ-OUT-LOUD (17 headings, top→bottom) — coherent, no contradictions.
Every match is a market for ninety minutes → Trade every minute of the match → Goal. Halt. Reprice. → Price is
probability → The whole idea, in one film. → Nobody is trusted. Everything is proven. (TxLINE signs / program
verifies / settlement is public) → The Booth explains every swing. → World Cup 2026 in numbers → One price: free.
→ Games, Moments, and match cards. All free. (Next Goal / Moments / Telegram match cards) → NINETY.

## MECHANICAL FULL-PAGE CHECKS
- **Em-dash (visible, whole body innerText): 0.** (Found + fixed 2 in the global chrome this pass — the
  PrototypeRibbon "Fixture data — live API" and the footer "Play money — no deposits" — which also clears every
  other route.) Match-pairing en-dashes (CAN–MAR) kept as the house convention.
- **Banned play-money vocab (bet/stake/odds/wager/gamble): 0.**
- **Numbers reconcile:** 61.4 · 41 · 104 · 48 · 1,000 · Jul 19 all present and consistent across sections.
- **A11y:** exactly 1 `<h1>`, no heading-level skips, 0 icon-buttons without a label, 0 `<img>` without alt.
  (axe not wired in-repo; manual criteria checked via getBoundingClientRect/DOM. Contrast is token-driven, light
  values AA-tuned per ADR-077.) 0 console errors on the prod build.
- **Theme-lock:** both themes render the SAME structure/hierarchy/rhythm; no section flips mid-page.

## CRESCENDO / LAYOUT DIVERSITY (S1/S2/layout-repetition)
LOUD cinema → quiet product River → LOOP → LOUD 61.4 → marquee break → film → proof stepper → Booth → LOUD
numbers+crest-wall → pricing → bento → LOUD NINETY. ≥6 distinct layout families (full-bleed scrub, split,
centred-number, marquee, stepper, bento, parallax-close). Spacing varies deliberately. Two slop sections were
DELETED this loop (FootballExperience 5-up grid; IconsGallery named-player strip), so the page is shorter and denser.

## OWNER-PROXY TEST
1. **Portfolio?** Yes (dark) — once the beat-1 cinema + WatchReel asset is licensed (B6). 2. **Screenshot to a
   friend?** Yes. 3. **First screenful wants a scroll?** Yes — the cinema opens on a goal with a SEQ readout and
   "scroll to replay". 4. **One thing never seen elsewhere?** YES — beat 1→2: a goal you scrub, resolving into a
   live price (60.x) moving on that goal; and the tournament as a wall of 48 real crests laid out as the draw.

## KNOWN / BLOCKERS (loop continues)
- Full-page captures show a large dark gap after beat 1: that is the pinned scroll-scrub's 220vh scroll-space
  rendered static — a fullPage artifact; the goal scrubs through it in real scrolling (verified pass 1).
- **B6** — beat-1 cinema + WatchReel film use one anime named-player clip (owner swap); `public/icons/*.jpg`
  orphaned (owner delete). **B5** — no real HL screenshot to composite against.

## LEDGER STATUS: this is **clean landing pass #1** of the 2 consecutive required for the exit line.
Next: the OTHER routes for slop-taxonomy zero, one per pass, then a clean landing re-verify (#2).
