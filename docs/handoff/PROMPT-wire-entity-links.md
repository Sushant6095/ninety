# Prompt — WIRE THE ENTITY LINKS (close the gap between built pages and the surfaces that should reach them)

The player and team pages exist and work. The problem is nothing links to them. This closes that, then
deploys. Single focused pass.

---

```
/player/[id] and /team/[code] are BUILT and rendering. Almost nothing links to them, so from a user's point
of view the feature does not exist. Wire every entry point, then deploy and verify on the LIVE url.

═══════════════════════════════════════════════════════════
STEP 1 — OPEN THE HONESTY GATE (it is stale)
═══════════════════════════════════════════════════════════
apps/web/src/components/ui/CommandMenu.tsx currently renders player / manager / venue rows as
INFORMATIONAL and non-navigable. Its own comment says "no page yet" — that is now FALSE for players.
  - Player rows → navigable to /player/[id] for every player that exists in the baked profile set.
  - Team rows → navigable to /team/[code].
  - A player NOT in the baked set stays informational (no 404s — the gate stays honest, it just moves).
  - Manager / venue: navigable only if a destination exists; otherwise leave informational.
  - Update that stale comment so the next reader is not misled again.

═══════════════════════════════════════════════════════════
STEP 2 — WIRE THE TERMINAL (the main complaint — currently ZERO links)
═══════════════════════════════════════════════════════════
grep of features/terminal/ finds no /player/ or /team/ links at all. Every entity name a user can see must
be clickable:
  - Score header: both team names + crests → /team/[code]
  - Market/screener rows: team names + crests → /team/[code]
  - Lineups tab: every player name → /player/[id]
  - Events / latest events (scorers, cards, subs): player names → /player/[id]
  - Booth commentary: player names where we can resolve them
  - Attack momentum / stats panels: team names → /team/[code]
Same treatment on /board (match cards, rails), /match/[id], /moments, /leaderboard, /competition, /bracket.
RULE: resolvable → real Link. Not resolvable → plain text, never a broken link. Never guess an id.

═══════════════════════════════════════════════════════════
STEP 3 — LINK AFFORDANCE (so users know it is clickable)
═══════════════════════════════════════════════════════════
A clickable name must look clickable: hover colour shift + underline-on-hover, visible focus ring,
44px hit target where it is a primary target. Tokens only. Do not turn the terminal into a sea of blue —
subtle hover treatment, consistent everywhere.

═══════════════════════════════════════════════════════════
STEP 4 — VERIFY ZERO DEAD LINKS (mechanical, not by eye)
═══════════════════════════════════════════════════════════
Clean prod build (rm -rf .next → ONE build → start :3000).
Then crawl: collect every href on /terminal, /board, /match/[id], /moments, /leaderboard, /competition and
request each one. ANY non-200 is a P0. Print the table of url → status. Zero 404s is the pass condition.
Click-test the palette too: open ⌘K, search a team and a player, press Enter, confirm you land on a real page.

═══════════════════════════════════════════════════════════
STEP 5 — DEPLOY AND VERIFY THE LIVE URL (not localhost)
═══════════════════════════════════════════════════════════
Commit (secret-scan first — the tree has been uncommitted for days), push, deploy to Vercel.
Then fetch the DEPLOYED pages and confirm:
  - https://ninety-nu.vercel.app/terminal contains /team/ and /player/ hrefs
  - a deployed /player/<real id> and /team/<real code> both return 200
A deploy you did not verify on the public url is not a deploy. Report the actual fetched evidence.
```

---

## Why this was missed (so it doesn't happen again)

The parallel decomposition split work by **destination** — build the player page, build the team page — and
never assigned the **entry points**. Session A owned the ticker, B the palette, C player pages, D team
pages; nobody owned "link to them from the surfaces that already exist."

Compounding it, the honesty gate written into Session B ("render non-navigable because no page exists yet")
was correct when written and became wrong the moment Session C landed — but lifting it was a note in the
parallel plan rather than a task with an owner, so nothing triggered it.

The lesson for future splits: **every new destination needs a paired task that wires its entry points**, and
any deliberate temporary gate needs a named owner for removing it.
