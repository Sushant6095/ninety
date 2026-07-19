# Prompt — REPLACE the hand-rolled generics with library components

Companion to `PROMPT-component-integration-wave1.md`. That one places NEW components; this one **deletes
our hand-built generic primitives and swaps in library versions**. Run them together.

This is not a preference — CLAUDE.md already says it: *"Generic primitives (dialog, tabs, scroll-area,
ticker, marquee, bento) → PULL from shadcn → magicui → 21st.dev, re-skin to tokens. Hand-build ONLY the
Ninety-specific pieces."* We drifted. This corrects the drift.

---

```
Replace our hand-rolled generic components with library components. The measure of success is that the
codebase gets SMALLER — if it grows, you layered instead of replacing.

═══════════════════════════════════════════════════════════
PROTECTED — never replace these (they ARE the product)
═══════════════════════════════════════════════════════════
MomentumRiver · MatchCard · PriceChip · TradeSheet (the trade ticket) · ProofBadge · the Booth.
Also Ninety-specific and staying: Flag, TeamCrest, CreditPill, Delta, LivePrice, HaltBanner, Wordmark,
Logomark, PrototypeRibbon, EntityLink, MomentCard, MomentHero, ThemeToggle.
Everything else in components/ui is a candidate.

═══════════════════════════════════════════════════════════
THE SWAP TABLE — audit each, replace or justify keeping
═══════════════════════════════════════════════════════════
  components/ui/ScrollArea.tsx      → shadcn scroll-area
  components/ui/Tooltip.tsx         → shadcn tooltip
  components/ui/HoverCard.tsx       → shadcn hover-card
  components/ui/Toaster.tsx         → shadcn sonner
  components/ui/Skeleton.tsx        → shadcn skeleton
  components/ui/Loading.tsx         → shadcn skeleton / spinner
  components/ui/Avatar.tsx          → shadcn avatar. ALSO fixes the pravatar bug — deterministic initials
                                      or identicon from the user id, no third-party CDN, no fake faces.
  components/ui/NumberTicker.tsx    → magicui NumberTicker (check vendor/magicui first — may already exist)
  components/ui/grid-pattern.tsx    → magicui grid-pattern (same check)
  components/ui/Reveal.tsx          → keep ONLY if it wraps our GSAP ScrollTrigger reveal; otherwise library
  components/ui/EquityCurve.tsx     → a real chart primitive (@shadcnblocks chart / recharts). Hand-rolled
                                      charts are where "generic" shows most.
  components/ui/Sparkline.tsx       → same chart primitive, small variant
  components/ui/RailCard.tsx        → shadcn card + our tokens
  components/ui/MilestoneBalloons.tsx → drop or replace; it earns little
  components/ui/StubScreen.tsx      → shadcn empty-state pattern
  features/*/Ticker.tsx             → @componentry/scroll-based-velocity
  features/*/marquee                → magicui marquee (or scroll-based-velocity — pick ONE, delete the other)
  features/*/dock, navbar           → @componentry/magnetic-dock
  features/*/Hero, hero             → @componentry/hero-geometric OR gradient-hero-01 (one, not both)
  features/landing/HeroGradientField → fold into the chosen hero component; do not keep two backdrops
  components/ui/CommandMenu.tsx     → keep the IA, adopt the apple-spotlight motion shell
                                      (see PROMPT-search-spotlight-amendment.md)
Lowercase files (button, card, input, label, badge, separator, toggle, toggle-group, dropdown-menu) are
already shadcn-shaped — verify, don't rewrite.

═══════════════════════════════════════════════════════════
HOW TO REPLACE (order matters — this is how you avoid breaking the app)
═══════════════════════════════════════════════════════════
For each swap, one at a time:
  1. Pull the library component into components/vendor/<lib>/ (keep the existing vendor convention).
  2. Re-skin to Ninety tokens: zero raw hex, zero neutral-/gray-/text-black/bg-white classes from the
     vendored source. Both themes must render.
  3. Re-point every import site. `grep` for the old component name — ZERO references must remain.
  4. DELETE the old file. A replacement that leaves the old file behind is dead code and the no-dead-code
     Stop hook will flag it.
  5. Build. Move to the next. Do not batch ten swaps and then build.
  6. PROVENANCE.md row: component · source · what it replaced.

═══════════════════════════════════════════════════════════
VERIFY
═══════════════════════════════════════════════════════════
□ Net line count in apps/web/src goes DOWN. Report before/after. Growth means you layered, not replaced.
□ Zero references to any deleted component; zero orphaned files.
□ Every surface still renders — full route sweep, both themes, screenshots LOOKED at.
□ Route-size table before/after: replacements should be neutral-to-smaller. Anything heavy goes dynamic.
□ Tokens only; axe 0 criticals; tick-flash still within 180ms on the terminal.
□ The protected list above is untouched — grep to prove it.
```

---

## Note for Sushant

**You're right, and it's your own law.** CLAUDE.md already said pull generic primitives from libraries and
hand-build only the six Ninety-specific pieces. The audit shows the drift: `ScrollArea`, `Tooltip`,
`HoverCard`, `Toaster`, `Skeleton`, `Loading`, `Avatar`, `NumberTicker`, `EquityCurve`, `Sparkline` — all
hand-rolled, all with better library versions. Hand-rolled generics are exactly where a site reads
"generic", because every one of them is slightly worse than the polished library equivalent, and the
slightly-worse compounds across forty components until the whole page feels off.

**The single best test of whether this pass worked: the codebase gets smaller.** If `apps/web/src` has more
lines after than before, the components were layered on top rather than swapped in, and you now maintain
both. Report the before/after count.

**Two that fix real bugs while you're in there:** replacing `Avatar.tsx` kills the pravatar hotlink and the
fake faces in one move, and replacing `EquityCurve`/`Sparkline` with a real chart primitive is where the
"$10,000 site" feeling actually comes from — hand-rolled charts are the most visible tell in the whole app.
