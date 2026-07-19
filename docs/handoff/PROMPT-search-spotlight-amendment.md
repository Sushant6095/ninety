# Amendment to Fix 2 (Session B) — adopt the 21st.dev `apple-spotlight` motion shell

**This is NOT a fifth session.** Search is Session B's territory. B applies this on top of
`PROMPT-search-entities.md`. Same ADR (ADR-081), same file ownership, same honesty gate.

## Verified: zero installs required

Checked against `apps/web/package.json` — every dependency the component assumes is already here:

| Needs | Have | Note |
|---|---|---|
| `framer-motion` | ^12.42.2 | also `motion` ^12.42.2 |
| `lucide-react` | ^1.24.0 | ✓ |
| `cn` from `@/lib/utils` | `src/lib/utils.ts` | clsx + tailwind-merge ✓ |
| `@/*` path alias | → `./src/*` | ✓ |
| `/components/ui` convention | `src/components/ui/` | `CommandMenu.tsx` already lives there |
| Tailwind | ^3.4.0 | v3 — the component is v3-compatible |

**Do NOT run any npm/pnpm install.** A shared `package.json` / `pnpm-lock.yaml` edit is an instant
conflict with Sessions A, C and D. If you believe something is missing, stop and report instead.

## What to take, and what to leave

Take the **motion vocabulary**. Keep the **Sofascore information architecture** from Fix 2.
The owner's words: *"same layout as of now but enhancing it."*

**TAKE:**
- The open/close spring (`stiffness: 550, damping: 50`) with scale + blur — that's the Apple feel.
- `layoutId` on the input container and the search icon, so the bar morphs rather than pops.
- The placeholder crossfade (`SpotlightPlaceholder`) — reusing it to echo the hovered row's name is a
  genuinely nice touch worth keeping.
- The row hover treatment: chevron fades in on the right.

**LEAVE (do not port):**
- All the demo data (Twitter / Safari / Mail → `x.com/samitkapoorr`). Every result comes from Fix 2's
  hybrid search — baked entity index + `GET /search`.
- The `ShortcutButton` fly-in dock. We have **category pills** (All · Team · Player · Match · Competition ·
  Manager · Venue), which is the Fix 2 spec. Don't ship both — it's two competing navigations in one bar.
- `<a href target="_blank">` on every row. Internal navigation uses Next `<Link>`; the Fix 2 honesty gate
  still binds — a row with no destination yet is **non-navigable**, never a 404, never a new tab.
- Its flat one-line rows. Fix 2's row is two lines with a 40px avatar (see `refs/README.md`).

## ⚠ The `url(#blob)` gooey filter — decide this before you build

That SVG filter (feGaussianBlur + feColorMatrix) is the component's signature effect, and it is also the
single most expensive thing in it. It's applied to the whole container *and animated*
(`filter: 'blur(20px) url(#blob)'` → `'blur(0px) url(#blob)'`) on top of `backdrop-blur-xl`.

The palette opens **over `/terminal` and `/board`** — live-price surfaces. ADR-058 bans GPU-heavy effects
there precisely because they contend with the 150ms tick path. A gooey filter compositing every frame while
the River ticks is that contention, exactly.

**Required approach:**
1. Run the filter **only during the open/close transition**, then set `filter: none` on completion
   (`onAnimationComplete`). A settled, static palette must carry no SVG filter.
2. Disable it entirely when the palette is opened over a live-price surface, or when
   `prefers-reduced-motion: reduce`.
3. **Measure it**: with the palette open over a ticking market, confirm no repeated long tasks and that the
   180ms price tick-flash still fires on schedule. If it costs the tick, drop the filter — the River is the
   signature element, not the search chrome.
4. It also blurs text mid-transition. Keep the transition under ~250ms so nothing is unreadable for long.

## Re-skin table — every raw class must become a token

The component ships **light-mode, raw Tailwind palette**. Ninety is token-only and runs light AND dark
(ADR-077). Raw palette classes are the same defect as raw hex. Map all of them:

| Component ships | Use instead |
|---|---|
| `bg-neutral-100` | `bg-[var(--surface)]` |
| `text-black` | `text-[var(--text-hi)]` |
| `text-gray-500` | `text-[var(--text-lo)]` |
| `hover:bg-white` | `hover:bg-[var(--hairline)]` (raised row) |
| `border` / `border-t` | `border-[var(--hairline)]` |
| `shadow-lg` / `shadow-md` | the `.elev-2` / `.elev-1` token shadows |
| `rounded-[30px]`, `rounded-xl` | `--radius-card` / `--radius-chip` |
| `text-2xl` input | the type scale; input ~17px per `refs/README.md` |

Verify afterwards: **zero** `neutral-`, `gray-`, `text-black`, `bg-white` classes remain, and the palette
renders correctly in BOTH themes (toggle `data-theme`).

## Additions the component lacks (all required by Fix 2)

- **Keyboard**: ↑/↓ move, ↵ opens, esc closes, ⌘K toggles, ⌘1–9 jump category. The component only does
  `inputRef.focus()` on mount — everything else you add.
- **A11y**: `role="combobox"` + `listbox`/`option`, `aria-activedescendant`, `aria-expanded`, visible
  focus ring, 44px hit targets. Run axe on the open palette.
- **`prefers-reduced-motion`**: no gooey filter, no scale/blur — a plain fade at `motion.reduced`.
- **Stagger cap**: the demo uses `delay: index * 0.1`, so row 11 waits 1.1s — unusable for search. Cap at
  ~20ms and stop staggering after ~6 rows. Search must feel instant.
- **Scroll**: `max-h-96 overflow-y-auto` is fine, but the keyboard-focused row must scroll into view.

## Provenance + verification

- `design/PROVENANCE.md` row: component `apple-spotlight` · source **21st.dev** · re-skinned to Ninety
  tokens · adopted for motion shell only, IA per ADR-081. (Under B's own heading — append only.)
- Note in ADR-081: what was taken, what was dropped (shortcut dock, demo data, target=_blank), and the
  gooey-filter decision with the measurement result.
- Verification is still ONE merged pass on the main tree (PARALLEL-PLAN.md). Have ready: palette open in
  dark AND light, empty state, results state, no-hits state, and the long-task/tick-flash measurement from
  the filter check.
