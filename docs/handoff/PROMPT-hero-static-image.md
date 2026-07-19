# Prompt — replace the landing scroll-scrub with a single static 4K hero

Small, fast, and it improves FCP. Run it in wave 1.

---

```
Remove the scroll-scrub frame sequence from the landing and replace it with ONE static 4K hero image.

STEP 1 — REMOVE
- Unmount <GoalReplayScrollLazy /> from features/landing/LandingLong.tsx.
- Keep GoalReplayScroll.tsx and GoalReplayScrollLazy.tsx in the tree (ADR-078 documents them; they may
  return), but they must not render. Confirm the no-dead-code Stop hook is satisfied — if it flags them,
  note the retention reason in the ADR rather than deleting the work.
- DELETE apps/web/public/frames/hero/ (96 JPGs, ~8MB). Those frames are a likeness/IP placeholder and must
  not ship publicly or sit in git history any longer than necessary. Update ADR-078 to record the removal
  and the reason.

STEP 2 — THE STATIC HERO
Source ONE image, in this order of preference:
  a) OURS — apps/web/public/teams/{id}/stadium.jpg. A floodlit stadium at night, darkened. Zero sourcing,
     zero licensing question, already shipped.
  b) Pexels / Pixabay, CC0, commercial use, no attribution required. Search: "stadium floodlights night",
     "football silhouette", "soccer ball net", "stadium crowd night".
  c) Generated, anonymous only — no identifiable player, no club or national kit, no brand marks.
NEVER: press-agency photographs, fan art, or any identifiable real player. If an image carries a watermark
or you cannot name its licence, it does not ship.

Treatment:
- Full-bleed at the top of the landing, 16:9, served via next/image with priority + a blur placeholder.
- A token-derived scrim (radial from the bottom) so the wordmark and thesis line stay legible — verify
  contrast, do not eyeball it.
- Ken-Burns is optional and must be transform-only, ≤1.04 scale over 20s, and disabled under
  prefers-reduced-motion.
- Keep the existing wordmark + "Every match is a market for ninety minutes." exactly as they are.

STEP 3 — VERIFY
- Clean prod build (rm -rf .next → ONE build → :3000). Screenshot the landing at lg+xl, both themes, LOOK.
- FCP must IMPROVE versus the scrub version — report both numbers. Removing 96 frames should show up.
- Confirm no request for /frames/ remains in the built output (grep it).
- design/PROVENANCE.md row: the hero image, its source, and its licence. This row is the record that the
  asset is clean — do not skip it.
```

---

## Why this is the right product call anyway

The scrub was a beautiful idea, but it cost ~8MB of frames, added decode work to the landing's critical
path, and only paid off for visitors who scrolled. A single strong 4K frame gives you the same emotional
first impression at a fraction of the cost — and it removes the one asset on the site whose provenance
couldn't be defended.

Keep the footage for the demo video. There you're the editor, it's offline, and you can cut as many films
together as you like without it being a public web asset.
