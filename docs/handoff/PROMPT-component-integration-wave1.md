# Prompt — Component integration, wave 1 (OriginKit + Componentry + anime.js)

~30 components, each with an assigned home. Read the governing rule before installing anything.

---

```
Integrate the component set below. Every one gets a JUSTIFIED placement — not a checklist tick.

═══════════════════════════════════════════════════════════
STEP 0 — PREREQUISITES (skip these and the build breaks)
═══════════════════════════════════════════════════════════
0a. anime.js: NOT installed, and apps/web/src/lib/anime.ts does NOT exist. CLAUDE.md is explicit that the
    FIRST anime.js import fails the build until the shared wrapper exists and law-guard allows it. So:
      1) pnpm --filter web add animejs
      2) create apps/web/src/lib/anime.ts — the ONLY place animejs is imported; re-export animate,
         createDraggable, createAnimatable, createTimeline, text (splitText/scrambleText), utils.
      3) update .claude/hooks/law-guard.sh to allow the wrapper path and still block direct imports.
      4) Only then import anime.js anywhere, and only ever from "@/lib/anime".
0b. Check before pulling: components/vendor/componentry/dithered-logo.tsx ALREADY EXISTS. Audit the whole
    vendor dir first and skip anything already vendored — do not create duplicates.
0c. You already ship 470 player photos at public/teams/{id}/players/*.jpg. Do NOT source new player images.

═══════════════════════════════════════════════════════════
THE GOVERNING RULE (this decides whether the site gets better or worse)
═══════════════════════════════════════════════════════════
Thirty effects used as a checklist will LOWER the score — that is exactly the slop the 9/10 loop is
deleting. A component earns its place or it does not ship. Three hard constraints:
  1. NOTHING GPU-heavy on /terminal, /board, /match or any live-price surface. Continuous shaders,
     particle fields, fluid trails, pixel canvases contend with the 150ms tick path (ADR-058). Landing,
     docs, /how-it-works and marketing surfaces only.
  2. anime.js scrambleText / textmorph NEVER on headings — your own vocab doc bans it ("makes them
     unreadable"). Use it on labels, numbers and short glyph runs only.
  3. Tokens only, prefers-reduced-motion honoured, lazy-mounted below the fold. Every pull gets a
     design/PROVENANCE.md row (component · source · placement).
If a component has no home where it clearly improves the page, say so in the ledger and drop it. That is a
pass, not a failure.

═══════════════════════════════════════════════════════════
PLACEMENT MAP — landing
═══════════════════════════════════════════════════════════
  hero-geometric / gradient-hero-01 → hero backdrop behind the frame-scrub. Pick ONE, not both.
  liquid-distortion   → the transition INTO the goal moment (the scrub hand-off). One beat, not ambient.
  kineticgrid         → faint background texture behind "price is probability". Behind content, low alpha.
  scroll-based-velocity → the existing "price · trade · settle · prove" velocity band. Direct replacement.
  circuit-board       → the ON-CHAIN / proof section. A circuit visual for on-chain verification is the
                        single best creative fit in this list — use it there and nowhere else.
  layered-stack       → football events / the Booth's match beats (the owner's own suggestion).
  scroll-split-card   → THE LOOP (goal → halt → reprice → Booth → settle), one card per beat.
  globe               → upgrade or replace the existing WorldGlobe in "the whole tournament".
  infinitegallery / infinite-image-field → the 48-crest wall, or a marquee of the 470 player photos.
  image-trail         → cursor trail over the crest wall. Landing only.
  image-ripple-effect → stadium imagery in the finale section.
  pixel-canvas        → the NINETY wordmark reveal in the finale.
  dithered-logo       → ALREADY VENDORED. Use it, don't re-pull.
  draggablesticker    → public/sticker-play-money.png. A draggable play-money sticker is on-brand and funny.
  magnetic-dock       → landing nav.
  weight-hover        → nav links + the big NINETY (variable-weight hover).
  textlift / textmorph / text-repel → section labels and eyebrows ONLY. Not headings (rule 2).
  fluidtrail          → landing hero cursor only. Measure it; drop it if it costs a long task.
  bouncy-accordion    → /how-it-works FAQ.

═══════════════════════════════════════════════════════════
PLACEMENT MAP — terminal (RESTRAINT; it must feel fast and calm)
═══════════════════════════════════════════════════════════
  electricborder → the owner asked for this "heavily". Use it as a STATE SIGNAL, not decoration:
                   • HALTED market panel (amber) • a filled trade confirming • a market going live.
                   It must be event-driven and settle to nothing. An always-on electric border around a
                   trading panel is noise, and it will show up in the long-task check.
  flight-status-card → the match status card. Departure/arrival maps beautifully onto kickoff/FT — a genuine
                   fit, but re-skin completely to tokens; nothing may look like an airline.
  NOTHING ELSE from this list goes on the terminal. No fluid, no particles, no pixel canvas.

═══════════════════════════════════════════════════════════
PLACEMENT MAP — player / team / docs
═══════════════════════════════════════════════════════════
  chart-radar-multiple (@shadcnblocks) → the player page attribute radar. This is EXACTLY the "Ninety index"
        specced in ADR-082 — derived from real per-90 stats, labelled as our derived model, never presented
        as an official rating. Also use it for team comparison.
  github-calendar  → docs page activity, or a "match density" calendar of the tournament.
  link-preview     → every outbound docs link (originkit.dev/components/link-preview).
  cursor-driven-particle-typography → docs or /how-it-works hero ONLY. Never near a price.

═══════════════════════════════════════════════════════════
anime.js — where it genuinely beats GSAP/Framer
═══════════════════════════════════════════════════════════
GSAP stays primary (ADR-052/059). Reach for anime.js only for what it does better:
  Draggable   → the play-money sticker, and a draggable compare/scrub handle.
  Animatable  → cursor-driven values that change every frame (fluidtrail, image-trail) — this is its
                sweet spot and is more efficient than re-creating tweens.
  Layout      → animating between layout states (grid ↔ list on the board, tab reflow) — genuinely hard
                in GSAP, trivial here.
  text.splitText → per-character reveals on eyebrows and labels.
  Three.js adapter → only if the globe/hero uses R3F (ADR-053 permits WebGL on the landing).
All of it imported from "@/lib/anime" — never directly.

═══════════════════════════════════════════════════════════
VERIFY
═══════════════════════════════════════════════════════════
□ Clean prod build (rm -rf .next → ONE build). Read the route-size table BEFORE and AFTER — report the
  delta per route. Thirty components is a real bundle risk; anything heavy must be dynamic + below-fold.
□ FCP not regressed on the landing; NO repeated long tasks during a full scroll; terminal tick-flash still
  fires within 180ms with everything mounted.
□ Both themes; prefers-reduced-motion renders calm/static everywhere.
□ Overlap check (sibling rect intersections >4px) at 1440/1920/narrow — new components are a common cause.
□ axe 0 criticals. Tokens only — zero raw hex, zero neutral-/gray- classes from vendored source.
□ PROVENANCE.md row per component. Ledger entry naming any component you DROPPED and why.
```

---

## Notes for Sushant

**The one thing that decides this.** Thirty effects can make the site extraordinary or make it a demo reel.
The difference is whether each one has a reason to be where it is. I've given every component a specific
home, and the two I think are genuinely inspired are **circuit-board on the on-chain/proof section** (a
circuit visual for on-chain verification — that's the kind of thing a judge remembers) and
**flight-status-card as the match status card** (departure/arrival → kickoff/FT maps perfectly).

**On electricborder "heavily" in the terminal** — I've scoped it to state signals: halt, fill, market going
live. An always-on electric border around a trading panel reads as noise and will fail the long-task check
your other loop is running. As a *halt* signal it's excellent; as wallpaper it's slop.

**Two prerequisites that will otherwise waste your time:** `animejs` isn't installed and `lib/anime.ts`
doesn't exist — CLAUDE.md is explicit that the first import fails the build until both exist and law-guard
allows the wrapper. And `dithered-logo.tsx` is **already vendored**, so audit the vendor dir before pulling
anything else.

**You don't need 50 player images — you have 470**, already baked at `public/teams/{id}/players/`. That's
the infinitegallery and image-trail source, free.

**On the football-songs music video:** famous football songs are licensed recordings, and sync rights for a
public site are a real cost. Given how careful you've been everywhere else, I'd use the crowd/stadium
ambience from your own stock footage instead — or ship it silent, which is what most premium landing pages
do anyway.
