# Ralph verdict — VelocityBand (clean) + FootballExperience (DELETED) · pass 5

- **Date:** 2026-07-19 · Pass 5 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-fbexp-deleted.png` (BEFORE grid | AFTER deleted-flow | REF)

## VelocityBand — NO SLOP, no change (honest clean pass)
The scroll-velocity chapter break ("price · trade · settle · prove") is a re-skinned magicui Marquee: CSS
compositor-only (the scroll-linked JS variant was cut for MotionScore, logged in PROVENANCE), aria-hidden
(the four verbs are real copy elsewhere), contrast-tuned (`text-lo/70` clears AA on the 48px bold), reduced-motion
→ one static centred row. Motion motivated (a typographic rhythm break between the price story and proof story).
It is the page's ONLY scroll marquee so far (watch ConsumerBento for a second one — design-taste marquee-max-1).
S1–S10 = 0. No change made.

## FootballExperience (section 5) — DELETED
### THREE WAYS IT WAS WORSE (from the composite)
1. **The canonical AI-slop grid.** A 5-up EQUAL icon-card grid (`01–05` + lucide icon + title + 2 lines, all
   identical weight) — the exact S3 / design-taste-9.C banned pattern, and 5-up is worse than 3-up.
2. **Pure recap.** Every one of its five steps is already shown LIVE elsewhere: "Watch the match" + "Read the
   River" = beat 2 River + the LOOP; "Call the next goal" / "Own the Moment" / "Follow in Telegram" = the
   ConsumerBento (Games/Moments/Telegram). It told what the page already shows.
3. **Three em-dashes** in visible copy (lines 12/30/58) — design-taste 9.G hard ban.

### DECISION: delete, not redecorate (subtract-then-elevate).
A shorter page that SHOWS beats a longer one that RE-TELLS. Removed `<FootballExperience />` + its import from
`LandingLong.tsx` and deleted the orphaned component file. The page now flows PRICE → VelocityBand → WatchReel
(the film) → PROOF — verified clean (no gap, build green, 0 console errors). Content survives in the live
sections + ConsumerBento; the "not a stats page" message is already carried by beats 1–2's thesis.

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · no-dead-code (orphan file removed) · tokens only · em-dashes removed with the section.

## HANDOFF
Next section WatchReel: (a) copy has an em-dash "Press play — it opens full screen" (9.G) to fix; (b) its video
thumbnail is the same named-player-likeness asset (B6 extended).
