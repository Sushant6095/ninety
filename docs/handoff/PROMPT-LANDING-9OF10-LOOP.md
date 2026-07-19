# THE 9/10 LOOP — calibrated against the real references, not against yourself

The previous ralph loop reported high craft scores. The owner looked at the result and said **3/10**.
That gap is the problem this loop exists to fix. You are not allowed to grade your own work in a vacuum
again.

---

```
Take the Ninety landing from 3/10 to 9/10, then every other page to zero-slop. Run all day. One section per
pass. Do not stop to report progress; do not ask what to do next.

═══════════════════════════════════════════════════════════
STEP 0 — WHY YOU WERE WRONG LAST TIME (read this twice)
═══════════════════════════════════════════════════════════
Last loop you scored the landing "BEAT-OR-MATCH ✅". The owner opened it and said it looks like shit. You
were not lying — you were marking your own homework against a rubric you wrote. This loop replaces
self-assessment with a CALIBRATION ANCHOR you cannot argue with.

THE ANCHOR — every single pass, before you score anything:
  1. Screenshot our section at 1440×900 AND 1920×1080.
  2. Screenshot the SAME region of the real reference:
       docs/hyperliquid-research/html/home.html  (open it locally, it's a real capture)
       docs/sofascore-research/_reference-shots/*.png
  3. Build a SIDE-BY-SIDE composite image (ours left, reference right — ImageMagick montage).
  4. LOOK at the composite. Write down, in plain words, the three ways ours is WORSE. Not "different" —
     worse. If you cannot name three, you are not looking hard enough; look again.
  5. Only then score. A score without a composite attached is void.
Ninety must BEAT the reference (ADR-049), never copy its hex, brand, copy or markup.

═══════════════════════════════════════════════════════════
STEP 1 — STRUCTURAL CHANGE, DO THIS FIRST
═══════════════════════════════════════════════════════════
Move the scroll-scrub frame sequence (GoalReplayScrollLazy, frames/hero/) to the VERY TOP of the landing —
it becomes the first thing on the page, above the current hero. The page opens on cinema, then resolves into
the product. Rework whatever the current hero was so it reads as the SECOND beat, not a competing first one.
Two heroes fighting each other is a large part of why the page reads flat.
Keep it landing-only; it must never appear on /terminal or /board.

═══════════════════════════════════════════════════════════
STEP 2 — THE BACKGROUND (sanctioned here, and only here)
═══════════════════════════════════════════════════════════
A flat #0B0D10 field is why the page feels dead. ADR-058 explicitly permits an animated shadergradient on
the LANDING HERO. Use that permission:
  - Depth: a slow, dark, token-derived gradient field; subtle grain; a vignette that pushes focus centre.
  - It must stay BEHIND content, never compete with it, and never appear on a live-price surface.
  - Respect prefers-reduced-motion (static field) and keep it off the main thread where possible.
  - Measure: no repeated long tasks during a full scroll; FCP must not regress past ~200ms.

═══════════════════════════════════════════════════════════
STEP 3 — THE SLOP TAXONOMY (count these; they are not opinions)
═══════════════════════════════════════════════════════════
Per section, count and drive each to ZERO:
  S1 Every section the same visual weight → no crescendo. A page needs loud/quiet/loud.
  S2 Uniform padding everywhere → flat rhythm. Vary section spacing deliberately.
  S3 Generic 3-up card grid with an icon, a heading and two lines of filler. This is THE AI-slop tell.
  S4 More than one focal point per screenful.
  S5 Body copy that could belong to any product ("seamless", "powerful", "experience the future").
  S6 Type scale too compressed — display type not dramatically larger than body.
  S7 Centred everything. Asymmetry reads as designed; centring reads as default.
  S8 Decorative motion that carries no meaning.
  S9 Elements overlapping/colliding (mechanical check: sibling getBoundingClientRect intersections >4px at
     1440, 1920 and a narrow width, both themes).
  S10 Any number on screen with no source, or any copy saying "live" over data that is not live.

═══════════════════════════════════════════════════════════
STEP 4 — THE LOOP, ONE SECTION PER PASS
═══════════════════════════════════════════════════════════
Work the landing top to bottom, one section at a time. For each:
  a. Clean prod build: rm -rf .next → ONE build → start on :3000. No dev server touching that dir. (This
     exact desync is what previously made the whole site look broken.)
  b. Composite vs reference (Step 0). Name the three ways ours is worse.
  c. Count the slop taxonomy (Step 3).
  d. FIX. Prefer SUBTRACT-THEN-ELEVATE: most slop dies by deleting a card, not adding one. If a section
     cannot reach 9, DELETE THE SECTION. A shorter page that is excellent beats a long page that is fine.
  e. PULL components as-is from the installed libraries and re-skin to tokens — shadcn → magicui →
     21st.dev → godui → skiper. Hand-build ONLY the six Ninety-specific pieces (River, MatchCard,
     PriceChip, trade ticket, ProofBadge, Booth). Writing your own tab/card/marquee is itself slop.
     PROVENANCE.md row for every pull.
  f. Re-build, re-composite, re-score. Log the pass in docs/ralph-ui-ledger.md with the composite path.
  g. Next section. When the landing is done, do every other route for slop taxonomy zero.

═══════════════════════════════════════════════════════════
STEP 5 — THE OWNER-PROXY TEST (answer honestly each pass)
═══════════════════════════════════════════════════════════
Look at the full-page screenshot and answer:
  1. Would I put this in my portfolio as my best work? If no — what specifically embarrasses me?
  2. If this were a stranger's site, would I screenshot it to show a friend?
  3. Does the first screenful make me want to scroll, or does it look like a template?
  4. Is there ONE thing here I have never seen on another site?
If the answer to 4 is "no", the page is not 9/10 no matter what the rubric says. Ninety's unmissable thing
is the live market — a price moving on a goal. Make that the thing.

═══════════════════════════════════════════════════════════
EXIT — all must hold on TWO consecutive passes
═══════════════════════════════════════════════════════════
□ Landing: every section, composite reviewed, ours BEATS the reference on the named axes
□ Slop taxonomy S1–S10 = 0 on every route
□ Owner-proxy test: yes to 1, 2, 3 and a concrete answer to 4
□ Clean prod build; FCP not regressed; no repeated long tasks on scroll; canvas guard passes
□ Both themes; prefers-reduced-motion honoured; axe 0 criticals
□ design-cop verdict per surface in design/verdicts/, each with its composite attached

BLOCKERS: anything needing the owner (env, credential, decision) goes to docs/BLOCKERS.md and you keep
going. Never stop the loop for a blocker.
Print when done: LANDING 9/10 — <n> passes, composites in design/verdicts/.
```

---

## Notes for Sushant

**Why the last loop failed you.** It scored itself against a rubric it authored, with no external anchor.
That is how an agent reports 9 while you see 3. The fix in this prompt is the **side-by-side composite**:
every pass it must place our screenshot next to the real Hyperliquid/Sofascore capture, look at both, and
name three ways ours is worse. It is much harder to fool yourself with the reference sitting next to you.

**The structural bet.** Moving the frame-scrub to the very top is the right call — the page currently has
two competing heroes, which is a big part of why it reads flat. Open on cinema, resolve into the product.

**One flag, then I'll stop repeating it:** that sequence is now the anime Messi clip, and putting it at the
very top makes it the first thing a judge sees rather than something mid-page. Likeness plus the adidas and
AFA marks. You've heard the argument; it's your call, and it's a fast swap with the extract script if you
change your mind.

**On "run all day":** the loop is one section per pass on purpose. Fifteen focused passes will beat three
sweeping ones, and the composite makes each pass falsifiable.
