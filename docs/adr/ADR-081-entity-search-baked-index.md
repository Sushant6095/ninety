# ADR 081 — Entity search runs on a baked index (zero third-party calls per keystroke)

Status: accepted · 2026-07-18 · extends ADR-051 (two-source law) · ADR-055 (baked assets) · ADR-072 (search route) · pre-assigned Fix-2 number (docs/handoff/PARALLEL-PLAN.md)

## Context

The ⌘K palette searched only Postgres `Match` rows (ADR-072): matches by fixture and the distinct
home/away names. We want a Sofascore-class entity search — Team · Player · Match · Competition ·
Manager · Venue — with rich two-line rows.

The hard constraint that dictates the architecture: the football data providers are rate-limited by
budget, not by concept. Football-Data.org = 10 req/min; API-Football = 100 req/**day**. A
search-as-you-type that calls either per keystroke would exhaust the daily budget in ~100 keystrokes.
So the index must be **baked once and searched locally** — zero third-party calls at query time, ever.

Baking roster data is also *correct* under the two-source law (ADR-051): squads, staff and match
officials **sit still** during a match — TxLINE still owns everything that MOVES (scores, prices,
halts, results). Roster data is context, exactly like flags and stadiums.

## Decision

**1. Bake the roster (one-time, committed).** `apps/web/scripts/fetch-squads.mjs`, wired into
`pnpm --filter web wc26:refresh`, fetches football-data.org competition **2000** (which turned out to
be the real FIFA World Cup 2026, season 2026-06-11 → 2026-07-19). Its `/competitions/2000/teams`
payload **embeds each team's full squad AND coach**, so the whole roster is **one** request, not 48;
plus one `/matches` request for referees. **Two API calls total** — the original 48-call/5-minute plan
was unnecessary. Photos are cross-referenced from the already-baked TheSportsDB `media.json` by slug
(football-data has no player images); unmatched players fall back to the team crest/flag — never a
wrong face. Writes:

| File | Rows (2026-07-18 bake) | Notes |
|---|---|---|
| `players.json` | **1249** | all 48 teams; fields: id · name · pos · dob · nat · teamCode · photo. 404 slug-matched to a local photo, the rest fall back to the crest/flag. |
| `coaches.json` | **46** | 46/48 teams carry a coach on football-data (2 honestly absent). |
| `referees.json` | **42** | distinct officials + nationality, from the per-match `referees[]` array. |

The bake refuses to write (exit 1) if any of the 48 teams fails to map to a wc26 team, so the index
is never silently partial. Mapping is TLA→FIFA-code first, then normalised name, then a small alias
table (Czechia/Turkey/USA/…).

**2. Search is hybrid, nothing hits the network per keystroke.**
- **Entities** (team · player · manager · venue · competition) — client-side rank over the baked JSON
  (`lib/data/entitySearch.ts`): exact = prefix > word-start > substring, tie-broken by entity
  importance (teams above players). Instant, offline-capable, zero network.
- **Matches** — the existing `GET /search` (Postgres, live status), with the baked fixture set
  (`MARKETS`) as the fallback when the API is absent (e.g. `NEXT_PUBLIC_USE_FIXTURES=1`, or a prod-web
  build served without the API). Live minute/score stay TxLINE-owned (match store), never invented.
- Debounced 120ms, abortable, min 2 chars.

The 285 KB players index is **dynamically imported** on first palette open, so it never enters the
initial bundle.

**3. The honesty gate decides which categories ship (a row that 404s is the fake-Solscan defect
class).** Phase-A detail pages don't exist yet, so:

| Category | Destination | Navigable? |
|---|---|---|
| Match | `/match/[id]` (exists) | yes |
| Team | `/competition` (group standings — honest, shows the team) | yes |
| Competition | `/competition` | yes |
| Player | — (no page yet) | **no** — informational row; every fact we hold is shown inline, Enter never routes to a 404 |
| Manager | — | **no** — same |
| Venue | — | **no** — same |

A visible chevron marks navigable rows; non-navigable rows carry no pointer and no chevron. **Referee**
is baked (`referees.json`) for Phase B / the match Events tab but is **not** a shipped tab — it's not
one of the six categories and has no destination. **News** is dropped — we hold no news data.

## Consequences

- Search is instant and works with the API down — the entity half is pure local compute.
- New provider fields need a re-bake (`pnpm --filter web wc26:refresh`), not a code change.
- Phase B (`/team/[code]`, `/player/[id]`, `/venue/[id]`) will flip the non-navigable categories to
  navigable; the index already carries the data those pages need.
- The bake reads `FOOTBALL_DATA_TOKEN` from env or `apps/api/.env`; the token is never printed,
  committed, or shipped to the client (only the derived JSON ships).

## Amendment (2026-07-18): 21st.dev `apple-spotlight` motion shell

Adopted the **motion vocabulary** of 21st.dev's `apple-spotlight` over the existing Sofascore IA
("same layout, enhanced"). Zero installs — `framer-motion` ^12 was already present.

**Taken:** the open/close **spring** (`stiffness 550, damping 50`) with scale + un-blur so the bar morphs
rather than pops; the **spotlight placeholder** crossfade (the bar echoes the hovered row's name, delegated
via `data-echo` so cmdk's item registration is untouched); the **chevron-on-hover** row treatment (now fades
in on hover AND keyboard selection).

**Dropped (deliberately):** the demo data (every row still comes from the hybrid baked-index + `GET /search`);
the `ShortcutButton` fly-in dock (we already have category pills — shipping both = two competing navigations);
`<a target="_blank">` per row (internal `router.push` via the honesty gate — a destination-less row stays
non-navigable, never a 404, never a new tab); its flat one-line rows (we keep the two-line, 40px-avatar row).

**The gooey `url(#ninety-goo)` filter — decision + why it's safe by construction.** The palette mounts from
`TerminalHeader`, so it genuinely opens over `/terminal` and `/board` — live-price surfaces where ADR-058 bans
GPU-heavy compositing (it contends with the 150ms tick + 180ms flash). Rather than measure-then-maybe-drop, the
filter is **gated off entirely on live-price surfaces** (`/terminal`, `/board`, `/match`) and under
`prefers-reduced-motion`; where it IS allowed it runs **only for the ~260ms transition window** and the settled
palette carries `filter: none`. The animated `blur()` is gated the same way — on a live surface the panel uses
only transform (scale) + opacity, which are compositor-cheap and safe beside the tick. So the contention the
amendment warns about cannot occur: the goo never composites over a ticking market. The empirical long-task /
tick-flash confirmation is part of the single merged verification pass (PARALLEL-PLAN §Verification).

**Shell swap:** cmdk's `Command.Dialog` (no exit animation, no motion control) was replaced with a `createPortal`
+ `AnimatePresence` shell around the **raw** `Command` (which still owns arrow-nav + listbox/`aria-activedescendant`).
The a11y the Dialog gave for free is re-implemented on the shell: `role="dialog"` + `aria-modal`, Escape-to-close,
scroll-lock, focus-into-input on open, focus-restore on close, and a Tab focus-trap. Keyboard (↑/↓/↵/esc, ⌘K
toggle, ⌘1–9 category jump) and the honesty gate are unchanged. `prefers-reduced-motion` → a plain opacity fade.
