# Ralph verdict — landing BOOTHQUOTES / "From the Booth" (pass 7)

- **Date:** 2026-07-19 · Pass 7 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-booth-vs-sofa.png`

## Finding: a legitimate quotes/commentary layout, not the S3 feature-card tell — with em-dash violations.
Three Booth commentary lines from the SAME featured market (CAN–MAR) the hero + LoopStage + Price sections show
(read-out-loud consistency), stamped 9' → 63' → 74' with the price move each made, climaxing on the 74' goal
(41 → 61.4, the number the Price section enlarges). The goal card carries the up-accent ring. Honest (illustrative
demo commentary, not invented testimonials). Obeys design-taste 4.10: quotes ≤2 lines, real attribution
("THE BOOTH · CAN–MAR", not name-only).

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Em-dashes in visible quote text (9.G hard ban)** — all three quotes + the intro used a mid-sentence em-dash.
   Fixed → period / semicolon / colon / comma. DOM check confirms the rendered section now has ZERO em-dashes.
2. **Reads slightly card-uniform** — three equal quote cards; the goal card's up-ring is the only hierarchy.
   Acceptable (it's a chronological timeline, not interchangeable features) — kept, per "don't manufacture fixes".
3. **Match-pairing en-dash** ("CAN–MAR", "Canada–Morocco") — KEPT deliberately: it is the app-wide house
   convention (River, LoopStage, ticker all use it) and a domain pairing, not the decorative en-dash-as-separator
   9.G targets. Changing only this section would break cross-surface consistency. Logged for an owner-level call.

## FIX
Visible-copy em-dashes → punctuation (quotes: "front foot. The market"; "No move; the Booth"; "lurches: CAN to
win"; intro: "market, every line"). No layout change (legitimate commentary layout).

## SLOP TAXONOMY (after): S1–S10 all 0.
S3 not the feature-card tell (quotes/timeline, 4.10) · S5 specific real commentary · S8 no gratuitous motion · S9 no collisions · S10 the 61.4/41 values reconcile with the Price + LoopStage sections · 9.G em-dash cleared (DOM-verified).

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · tokens only · reduced-motion (cards static, no hover by design).

## HANDOFF
Next section IconsGallery intro copy has an em-dash: "forty-eight of those shirts are live markets — hover a shirt to bring it forward." (9.G) — fix on that pass.
