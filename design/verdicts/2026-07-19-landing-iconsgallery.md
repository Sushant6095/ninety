# Ralph verdict — landing ICONSGALLERY / "The icons" (pass 8) — DELETED

- **Date:** 2026-07-19 · Pass 8 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-iconsgallery-deleted.png` (BEFORE strip | AFTER safe CrestWall | REF)

## THREE WAYS OURS WAS WORSE (from the composite, before deleting)
1. **Biggest legal liability on the page (B6).** The hover-expand strip is 7 REAL named-player broadcast stills —
   Bellingham, Zlatan (AC Milan / Emirates + adidas), Haaland, Zidane, Messi (Argentina AFA + adidas), Pelé —
   carrying live club + sponsor + federation trademarks. Real photographs of real people, not even stylized.
   CLAUDE.md legal armor explicitly forbids this on the public landing.
2. **Decorative-only (S8).** A nostalgia photo strip with a hover-expand flourish that carries zero product
   information — motion with no meaning.
3. **Redundant.** The CrestWall immediately below makes "48 shirts = 48 markets" literal with SAFE baked crests
   (ADR-055) — the real, on-brand version of "the shirts as markets". The named-player strip added liability, not information.

## DECISION: DELETE (subtract-then-elevate).
Removed `<IconsGallery />` + import from `LandingLong.tsx` and deleted the orphaned component. The page now flows
BoothQuotes → numbers/CrestWall (verified clean, no gap, build green, 0 console errors). Deleting the section
removed the entire named-player-likeness surface it carried (7 assets) rather than deferring it. Its intro em-dash
went with it too. The `public/icons/*.jpg` stills are now unreferenced (flagged in BLOCKERS B6 for owner deletion).

## SLOP / LEGAL AFTER
S8 decorative strip gone. B6 surface reduced from (beat-1 + WatchReel + 7 icon stills) to just (beat-1 cinema +
WatchReel film — one anime clip). The "greats" nostalgia beat is lost; the CrestWall's 48 real crests carry the
"every shirt a market" message safely and denser.

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · no-dead-code (orphan component removed) · tokens only.

## HANDOFF
Next section (numbers/CrestWall, section 7): the left stat column (104/48/1,000/Jul 19) leaves a dead lower-left
quadrant beside the taller crest wall (same pattern fixed in the LOOP pass) — assess/tighten on that pass.
