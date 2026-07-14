# 007 — Halt banner: CSS sweep, animated exit, eq-bar cleanup

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: MEDIUM
- **Category**: Performance / Interruptibility
- **Estimated scope**: 3 files (`HaltBanner.tsx`, `MatchColumn.tsx`, `globals.css`), ~30 lines

## Problem

1. **Main-thread infinite loop during the busiest moment.** The banner's decorative shimmer is a framer-motion `x` shorthand on `repeat: Infinity` — rAF-driven style writes every frame for the entire halt, exactly while LivePrice flashes across rows; it also keeps ticking offscreen where CSS would be throttled:

```tsx
/* apps/web/src/components/ui/HaltBanner.tsx:24-31 — current */
<m.span
  aria-hidden
  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-halt/15"
  initial={{ x: 0 }}
  animate={{ x: "500%" }}
  transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
  style={{ filter: "blur(8px)" }}
/>
```

2. **Hard-cut exit.** `features/terminal/MatchColumn.tsx:142` renders `{view === "HALTED" && <HaltBanner …>}` — animated entrance, teleport exit + instant layout collapse on resume.

3. `apps/web/src/styles/globals.css:58` — `.eq-bar { … will-change: transform; animation: eq 900ms ease-in-out infinite; }`: permanent `will-change` on always-animating bars is redundant (a running animation already promotes the layer) and violates the house "narrow, removed when done" rule.

## Target

1. Replace the framer shimmer with a CSS keyframe (compositor-run, auto-throttled offscreen):

```css
/* globals.css — ADD near the eq keyframes */
/* Halt-banner shimmer — compositor-only translateX loop; amber is halt-only (design law). */
@keyframes haltSweep { from { transform: translateX(0); } to { transform: translateX(500%); } }
.halt-sweep { animation: haltSweep 2.4s linear infinite; }
```

```tsx
/* HaltBanner.tsx — target for the shimmer span */
{!reduce && (
  <span
    aria-hidden
    className="halt-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-halt/15"
    style={{ filter: "blur(8px)" }}
  />
)}
```

2. Animated exit: in `MatchColumn.tsx`, wrap the conditional in `AnimatePresence` (framer is already imported in the tree) and give `HaltBanner`'s root `m.div` an `exit={{ opacity: 0, y: reduce ? 0 : -8 }}` with `transition={{ duration: mo.fast / 1000, ease: mo.easeOut }}` — exit FASTER than enter (150 vs 200ms; the system response snaps). `AnimatePresence` needs the banner to be its direct child; keep the `key` stable (`"halt-banner"`).

3. Delete `will-change: transform;` from `.eq-bar` in globals.css:58.

## Repo conventions to follow

- Motion tokens: `import motion as mo from "../../design/motion"` is already the pattern in HaltBanner.tsx.
- `prefers-reduced-motion`: the `!reduce` gate on the shimmer stays; plan 002's global rule (iteration-count) is the backstop.
- Exit-faster-than-enter is Emil's asymmetric-timing rule; enter stays `mo.transition` (200ms).

## Steps

1. Add the `haltSweep` keyframes + `.halt-sweep` class to globals.css; swap the `m.span` in HaltBanner.tsx for the plain span per Target.
2. In `MatchColumn.tsx:142`, wrap the halted-banner conditional in `<AnimatePresence>` (import from "framer-motion") and add the `exit` prop to HaltBanner's root (HaltBanner must accept/forward it — it already renders an `m.div` root; add the `exit` + faster transition there).
3. Remove `will-change: transform` from `.eq-bar`.

## Boundaries

- Do NOT touch `useHaltSequence.ts` — the halt timeline is settled and was just fixed (sweep crossing, autoplay race) at commit 4c0975f.
- Do NOT change the banner's copy, colors, or the amber token usage.
- Do NOT animate layout on exit (no height collapse tween — the fade+rise is enough; if the row collapse looks jarring in the feel check, note it in the report rather than improvising a height animation, which is a banned layout-property animation).

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0.
- **Feel check**: `/terminal` during the halt beat — shimmer still sweeps; in DevTools Performance, the shimmer produces no per-frame main-thread style writes (compare: record 2s during halt; look for absence of recurring "Recalculate style" from framer). On resume, the banner fades out and rises 8px over ~150ms instead of vanishing.
- **Done when**: shimmer runs as a CSS animation, resume exits smoothly, `.eq-bar` has no will-change.
