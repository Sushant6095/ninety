# Prompt — Session F: the landing FINALE — parallax closer + big bold NINETY

Runs in PARALLEL with the 9/10 loop and Sessions A–E. You are **Session F**. ADR: **ADR-085**.
You own ONLY `apps/web/src/components/ui/parallax-finale.tsx` and the final section of the landing.

---

```
Build the closing section of the landing: a layered parallax scene with a huge bold NINETY wordmark. Use the
21st.dev `mountain-vista-bg` component as the TECHNIQUE reference (layered background planes at different
speeds/sizes/z-indexes). Four things about that component must change before it ships — read STEP 0.

═══════════════════════════════════════════════════════════
STEP 0 — WHAT MUST CHANGE FROM THE SOURCE COMPONENT (non-negotiable)
═══════════════════════════════════════════════════════════
0a. SUBJECT. The source is mountains + cyclists. We are a FOOTBALL exchange. A mountain-biking scene at the
    bottom of a World Cup trading site is exactly the off-theme decoration we are trying to delete — it
    would ADD slop while the parallel loop removes it. Keep the layering technique; change the subject to
    football, built from assets we ALREADY SHIP:
      apps/web/public/teams/{id}/stadium.jpg   ← 47 real stadium photographs
      apps/web/public/teams/{id}/badge.png     ← 48 crests
      apps/web/public/flags/w160/*.png
    Suggested composition, back to front: night sky/floodlight glow → stadium skyline (stadium.jpg,
    darkened + blurred) → a slow-drifting band of 48 crests → a foreground pitch-line/grass edge → the
    NINETY wordmark. The crest band is the football equivalent of their moving bikes and it is OURS.
0b. NO THIRD-PARTY CDN. The source hotlinks s3-us-west-2.amazonaws.com/s.cdpn.io/24650/*.png — another
    author's CodePen assets. That is someone else's copyrighted art on someone else's bandwidth, and if it
    disappears the landing breaks mid-demo. ADR-055 already forbids runtime asset CDNs. Every image is local.
0c. THE PROVIDED CSS IS INCOMPLETE — as pasted it will not animate. It defines only the two @keyframes.
    Missing: the `.parallax-layer` base (position:absolute, inset, background-repeat:repeat-x,
    animation-iteration-count:infinite, animation-timing-function:linear) and `animation-name: parallax_fg`
    for layers 1–6 (only the bikes declare a name). Write the complete rule set.
0d. PERFORMANCE. The source animates `background-position`, which repaints every frame and is NOT
    GPU-composited. Eight full-width layers of that on our landing (FCP ~104ms, "no repeated long tasks"
    rule) is a regression. Animate `transform: translate3d(x,0,0)` on duplicated tiles instead, with
    `will-change: transform`. Measure after: no repeated long tasks during a full scroll.

═══════════════════════════════════════════════════════════
STEP 1 — TECH FACTS FOR THIS REPO (verified — do not follow the snippet's assumptions)
═══════════════════════════════════════════════════════════
- Tailwind here is **3.4.0**, NOT v4. Do NOT use `@import "tailwindcss"` / `@theme inline`. Keyframes and
  base classes go in the existing globals.css / tailwind.config.ts.
- `/components/ui` already exists at apps/web/src/components/ui/ (shadcn-style). `cn` is at
  src/lib/utils.ts. The `@/*` → `./src/*` alias exists. framer-motion + lucide-react are installed.
- INSTALL NOTHING. `tw-animate-css` is not needed and a package.json change collides with other sessions.
- Colours via tokens only. The scene is imagery + token-tinted scrims — zero raw hex.

═══════════════════════════════════════════════════════════
STEP 2 — THE WORDMARK (this is the point of the section)
═══════════════════════════════════════════════════════════
Huge, bold NINETY as the page's final statement:
  - Display type at the top of the scale (`--text-hero` or larger), tight tracking, `--text-hi`.
  - Full-bleed, optically centred, sitting IN the scene — let the foreground layer overlap its base
    slightly so it reads as depth, not as text pasted on a picture.
  - Underneath it, one honest line and the primary CTA. No filler paragraph.
  - The wordmark must remain legible over every layer: use a token-derived scrim, and verify contrast.

═══════════════════════════════════════════════════════════
STEP 3 — MOTION + A11Y
═══════════════════════════════════════════════════════════
- Layer speeds must differ enough to read as depth (far layers slow, near layers fast) but stay calm —
  this is a closer, not a carousel.
- `prefers-reduced-motion: reduce` → render the scene STATIC (no drift at all). Required by design law.
- Lazy-mount the section (IntersectionObserver, like FlowFieldLazy/WorldGlobeLazy) so it never costs FCP.
- Landing ONLY. Never on /terminal, /board or any live-price surface.

═══════════════════════════════════════════════════════════
STEP 4 — VERIFY
═══════════════════════════════════════════════════════════
- Clean prod build (rm -rf .next → ONE build → start :3000; no dev server touching that dir).
- Screenshot the finale at lg+xl, BOTH themes, and LOOK. Capture the MOTION too (several frames) — a still
  cannot prove a parallax drifts.
- Confirm: zero external image URLs in the built output (grep for `cdpn.io` and `amazonaws` — must be zero),
  zero raw hex, reduced-motion renders static, no repeated long tasks on scroll, FCP not regressed.
- Read-out-loud: the wordmark, the line under it and the CTA agree and say something true.
- PROVENANCE.md row: technique from 21st.dev `mountain-vista-bg`, re-subjected to football, assets local.
- ADR-085 records the subject swap, the CDN removal, and the transform-vs-background-position change.
```

---

## Note for Sushant

The instinct is right — the page needs a real ending, and a big NINETY over a layered scene is a strong one.
Three things about that specific component would have worked against you:

**It's mountains and cyclists.** You asked, in the same breath, to remove all AI slop and to add a
mountain-biking scene to a World Cup football site. That's the definition of decorative off-theme filler —
a judge would clock it instantly. The technique is good; the subject has to be football.

**It hotlinks another person's CodePen images** from an S3 bucket. If that bucket changes during judging,
your landing breaks live. And it's their artwork on their bandwidth.

**You already own something better.** 47 real stadium photographs, 48 crests, jerseys, flags — all baked
locally, all on-theme, all yours. A drifting band of 48 national crests behind a giant NINETY says exactly
what your product is. Their moving bikes become your moving crests.

Two smaller technical notes: the CSS as given is incomplete (it defines the keyframes but not the
`.parallax-layer` base or the animation-name for layers 1–6, so nothing would move), and it animates
`background-position`, which repaints rather than composites — eight layers of that would show up in the
long-task check the other loop is running.
