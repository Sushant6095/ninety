# FINAL PARALLEL PROMPT — three lanes, one merge, ship it

All decisions are made below. Nothing is blocked on the owner. Run the three lanes concurrently,
then the shared finish. **Push is authorised — go.**

---

```
Three lanes in parallel. Each owns its files exclusively — do NOT touch another lane's paths.
When all three report done, run the FINISH sequence once.

═══════════════════════════════════════════════════════════
DECISIONS ALREADY MADE — do not re-ask
═══════════════════════════════════════════════════════════
• Identity: OFFLINE FIRST. Per-browser session, no API dependency. Live embedded-wallet auth is a
  post-submission upgrade.
• The Fly API is LIVE and PUBLIC: https://omnipitch.fly.dev (/health returns {"ok":true}, /auth/me
  responds). No secrets are needed to call it. Vercel just needs NEXT_PUBLIC_API_URL set to that origin.
• Git push: AUTHORISED. Commit app code AND docs — they're the same submission.
• PART 2 (GSAP motion): SKIPPED, except one item assigned to Lane 3.
• PART 4 (30 edge cases): reduced to ONE — the pre-match state. That's what a judge actually sees.

═══════════════════════════════════════════════════════════
LANE 1 — ENTITY LINKS (everything except /terminal)
OWNS: features/board/* · app/match/[id]/* · features/moments/* · features/competition/* ·
      features/bracket/* · components/ui/CommandMenu.tsx
═══════════════════════════════════════════════════════════
- Every team name + crest → /team/[code]. Every player name → /player/[id].
- Resolvable → real Next <Link>. Not resolvable → plain text. NEVER a guessed id, never a 404.
- CommandMenu: confirm the honesty gate is open for players/teams that exist in the baked set;
  anything not baked stays informational.
- Affordance: hover colour shift + underline, visible focus ring, 44px hit target on primary targets.
  Tokens only. Subtle — don't turn the app blue.
- DO NOT touch features/terminal (Lane 3 owns it) or the identity consumers (Lane 2).

═══════════════════════════════════════════════════════════
LANE 2 — REAL PER-USER IDENTITY (the P0)
OWNS: lib/fixtures.ts (SESSION) · lib/terminal.ts (SESSION_RANK) · lib/portfolio.ts ·
      a NEW session provider · components/ui/AppShell.tsx (header) · features/leaderboard/* ·
      app/profile/* · app/settings/* · app/portfolio/*
═══════════════════════════════════════════════════════════
- Create a client SessionProvider: on first load, generate a per-browser identity (id + handle),
  persist to localStorage. Two browsers = two different users. No API call required.
- DELETE both hardcoded identities: SESSION `@vd` (lib/fixtures.ts:54) and SESSION_RANK `@you`
  (lib/terminal.ts:117). ONE handle everywhere — grep the build for "@vd" and "@you", both must be gone.
- Each session gets its OWN credits, positions, portfolio, rank — derived per-session, not shared.
- HONEST FIRST RUN: a brand-new user has 1,000 credits, NO positions, NO rank yet. Do not fabricate a
  starting portfolio or a rank of #142. Empty states must read as intentional.
- Avatars: deterministic from the session id — initials in a token-coloured disc. No network, no faces.
  (pravatar is already gone; keep it gone.)
- Leaderboard: this lane owns it. Show real seeded entries or an honest empty state; the signed-in user's
  row reflects the real session. Also do the team/player links inside it while you're there.
- Sign-out clears the session and issues a fresh one.

═══════════════════════════════════════════════════════════
LANE 3 — TERMINAL: HIERARCHY + PRE-MATCH STATE
OWNS: features/terminal/** (exclusively — everything in it)
═══════════════════════════════════════════════════════════
1. HIERARCHY (this is why it reads 5/10 — every panel currently has equal visual weight):
   PRIMARY   → match header, Momentum River, trade ticket. Larger type, more space, stronger contrast.
                A first-time viewer's eye must land here.
   SECONDARY → market list, positions, Booth.
   TERTIARY  → movers, leaderboard, telemetry. Smaller, quieter, lower contrast.
   Vary panel spacing deliberately (uniform padding reads flat). Make the biggest number genuinely big.
   SUBTRACT-THEN-ELEVATE: collapse or cut any panel that earns nothing.
2. PRE-MATCH STATE (the one edge case that matters): feed connected, no in-play prices yet. It must look
   INTENTIONAL, not broken — a clear "live feed connected · market pre-match" state, real fixture and
   kickoff time, trade ticket disabled with a reason, River showing an honest empty/flat state. Screenshot it.
3. LINKS inside the terminal (Lane 1 does NOT touch this file tree): team names in the score header and
   market rows → /team/[code]; player names in lineups/events → /player/[id]. Same rules: resolvable or
   plain text, never a 404.
4. ONE motion item only: the TRADE FILL. Ticket confirms → position row enters → credits count to the new
   balance. Via lib/gsap.ts, tokens for timing, prefers-reduced-motion honoured. Nothing else.

═══════════════════════════════════════════════════════════
FINISH — run ONCE, after all three lanes report done
═══════════════════════════════════════════════════════════
1. Merge all three lanes.
2. Clean build: rm -rf .next && pnpm --filter web build   (ONE build, no dev server on that dir)
3. pnpm test — report the real number.
4. DEAD-LINK CRAWL: collect every href on /, /board, /terminal, /match/[id], /moments, /leaderboard,
   /competition, /player/[id], /team/[code] and request each. Any non-200 is a P0. Print the table.
5. IDENTITY CHECK: two separate browser profiles → two different handles, credits and positions.
   Grep the built output: zero "@vd", zero "@you", zero "pravatar".
6. Screenshot /terminal, /board, /leaderboard at lg+xl, BOTH themes, plus the pre-match state. LOOK at them.
   Read-out-loud each: no two numbers may contradict.
7. Secret-scan → commit (app code AND docs) → push.
8. Deploy: Vercel (confirm NEXT_PUBLIC_API_URL=https://omnipitch.fly.dev is set in Vercel's env, not just
   the local .env). Fly only if anything under apps/api, apps/worker-* or packages/ changed.
9. VERIFY THE LIVE URL — fetch https://ninety-nu.vercel.app/terminal and grep the response for:
   "pravatar", "@vd", "3,412", "Live data from TxLINE". All must be ABSENT. Then confirm
   /player/<real-id> and /team/<real-code> both return 200 on the deployed site.
   A deploy you did not fetch is not a deploy — that has silently failed twice on this project.
10. Report: what shipped, the crawl table, and anything you had to cut.
```

---

## Why it's split this way

The only real collisions were **leaderboard** (identity + links both want it) and **terminal** (hierarchy +
links both want it). So leaderboard goes wholly to Lane 2 and terminal wholly to Lane 3 — each lane does
*both* jobs inside the files it owns. No file is touched twice, so the merge is clean.

## The stop line

This is the last build task. When the finish sequence goes green, **stop coding and film.** The video is an
absolute screening requirement, judging leans heavily on it, and the tournament ends before review — judges
most likely will not see the site running at all.
