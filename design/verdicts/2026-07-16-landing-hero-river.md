# Verification verdict — landing hero River fix · 2026-07-16 (LOCAL PRODUCTION build, :3000)

Scope: `HeroRiver` `yRange={[0,100]}` pin (fix the hero-right void) + README notio attribution. The notio landing itself was design-cop **SHIP** at ADR-066 (fleet); this is a one-prop refinement, so the check is: does the River now anchor the hero, and did anything regress?

Method: `pnpm --filter web build` → `start` on :3000 → `screenshot.mjs / hero-fixed.xl` → **LOOKED**. Not judged in dev.

- **Hero River (the fix) — PASS.** The right half now draws a filled green momentum area rising to the 61.4 edge; the void/faint-glow is gone. Design law #1 ("all visual boldness lives in the River") is now actually satisfied on the landing — the River is the hero anchor, not dead space.
- **Read-out-loud — PASS.** Hero: `CAN-MAR 1-0 · HALTED · 74' · CAN TO WIN 61.4` — self-consistent. Stats band: **104 fixtures · 48 teams · 1,000 credits · Jul 19 MetLife** (settled count-up values = the real WC26 facts; 43/93/898 were mid-animation frames).
- **Canvas guard — PASS (visible).** The two visible hero-River canvases are 460×300 (`cssW 460`), not the 300px blank default. Two hidden 300×150 (`cssW 0`) canvases are a responsive/ghost pane, not user-visible (same as the terminal's `display:none` mini-charts, ADR-058).
- **axe — 0 violations** on `/`. **tsc** clean.
- **No regression** to the rest of the notio landing (hero type, Goal-Halt-Reprice + Featured crests, price-is-probability particle 61.4, Nobody-is-trusted, stats+globe, One-price-free, Booth, whistle-opening-bell all render as before).

Verdict: **SHIP.** Note: this is the verifier's LOOK-based verdict, not a fresh design-cop-agent run; the landing carries design-cop SHIP from ADR-066 and this change only strengthens the hero. A full design-cop re-pass is available on request.
