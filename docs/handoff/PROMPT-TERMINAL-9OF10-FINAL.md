# FINAL TERMINAL PROMPT — 5/10 → 9/10, real identity, demo-proof

The terminal is the surface being recorded. This is the last pass on it.

---

```
Take /terminal from 5/10 to 9/10: real per-user identity, purposeful motion, and every demo edge case
handled. Loop until the exit conditions hold. Clean prod build only (rm -rf .next → ONE build → :3000);
never a dev server on that dir.

═══════════════════════════════════════════════════════════
PART 1 — REAL IDENTITY (the owner named this; it is a P0)
═══════════════════════════════════════════════════════════
Today every visitor IS the same person. Three concrete defects:
  a) apps/web/src/lib/fixtures.ts:54 → SESSION = { handle:"@vd", credits:2450, rank:142 } — hardcoded.
  b) apps/web/src/lib/terminal.ts:117 → SESSION_RANK = { handle:"@you", rank:142 } — a SECOND hardcoded
     identity. The same user is "@vd" in one panel and "@you" in another. That is a read-out-loud
     contradiction shipping live right now.
  c) components/ui/Avatar.tsx hotlinks https://i.pravatar.cc/... — a third-party CDN serving photos of
     people who do not exist, as our users. Someone added `impeccable-disable broken-image` to silence the
     linter instead of fixing it.

FIX — wire the auth that already exists (do NOT build new auth):
  - POST /auth/embedded/start → an embedded wallet + session per visitor, on first load, no password, no
    PII. GET /auth/me for the session. /auth/challenge + /auth/connect stay available for wallet users.
  - One session object, ONE handle, used by every panel. Delete both hardcoded SESSION constants.
  - Each visitor gets their OWN credits, positions, portfolio, rank. Two browsers = two identities.
  - AVATARS: delete pravatar entirely (and the impeccable-disable). Generate deterministically from the
    user id — initials in a token-coloured disc, or a seeded geometric identicon. No network, no fake faces.
    Apply to the header, leaderboard, profile and Booth alike.
  - Sign-out + "export wallet" already exist in settings — make sure they act on the real session.
  - Empty first-run state must be honest: a brand-new user has 1,000 credits, NO positions, NO rank yet.
    Do not fabricate a starting portfolio.

═══════════════════════════════════════════════════════════
PART 2 — MOTION: PURPOSEFUL GSAP ONLY (read the constraint first)
═══════════════════════════════════════════════════════════
CONSTRAINT: CLAUDE.md says the landing feels ALIVE and trading surfaces feel FAST AND CALM. Adding
decorative motion to a terminal makes it WORSE, and heavy GPU work here breaks the 150ms tick path. So every
animation must COMMUNICATE A STATE CHANGE. If it cannot be justified in one sentence, do not add it.
Sanctioned GSAP additions (via lib/gsap.ts, tokens for timing, prefers-reduced-motion honoured):
  - Trade fill: the ticket confirms, the position row enters, credits count down to the new balance.
    This is the money moment of the demo — it currently has almost nothing.
  - Price change: the existing 180ms flash must re-fire on rapid same-direction ticks (a silent tape during
    a rally is a bug, per design law). Verify it does.
  - Halt: the amber sweep across the market panel — already exists on the landing, bring the same beat here.
  - Position P&L: number rolls to its new value rather than snapping.
  - Tab rail: the active underline slides between tabs.
  - Panel mount: ONE short staggered reveal on first load only — never on re-render, never on every tick.
BANNED here: background gradients, parallax, scroll-scrub, anything continuously animating.

═══════════════════════════════════════════════════════════
PART 3 — 5/10 → 9/10 IS A HIERARCHY PROBLEM, NOT A FEATURE PROBLEM
═══════════════════════════════════════════════════════════
The terminal already has the density (markets, River, Booth, ticket, positions, movers, leaderboard). It
reads 5/10 because everything has the SAME visual weight, so nothing leads. Establish a clear order:
  PRIMARY   — the match header, the Momentum River, the trade ticket. These should dominate: larger type,
              more space, stronger contrast. A first-time viewer's eye must land here.
  SECONDARY — market list, positions, Booth.
  TERTIARY  — movers, leaderboard, telemetry. Smaller, quieter, lower contrast.
Then: vary panel spacing deliberately (uniform padding reads flat), make the biggest number on screen
genuinely big, and cut or collapse any panel that earns nothing. SUBTRACT-THEN-ELEVATE — a terminal with
seven excellent panels beats one with twelve adequate ones.
Pull any generic primitive (tabs, tables, scroll-areas, popovers, toasts) AS-IS from shadcn → magicui →
21st.dev and re-skin to tokens. Hand-build only River, MatchCard, PriceChip, trade ticket, ProofBadge, Booth.

═══════════════════════════════════════════════════════════
PART 4 — EDGE CASES (every one must be handled, not just the happy path)
═══════════════════════════════════════════════════════════
Build and SCREENSHOT each state. A demo dies on the state you did not think about.
MARKET STATE
  □ Pre-match, feed connected, no prices yet ← THIS IS THE CURRENT REAL STATE. Must look intentional.
  □ In-play, prices ticking      □ Halted (amber)      □ Settled       □ Match finished mid-session
  □ No live matches at all       □ Market suspended / no quote available
USER STATE
  □ Brand-new user: 1,000 credits, no positions, no rank    □ Zero credits    □ Single position
  □ Many positions (scroll)      □ Position in profit / in loss / at zero
TRADE FAILURES (each needs a clear, human message — never a silent no-op)
  □ Insufficient credits   □ Size zero or above max   □ Market halted mid-submit   □ Price moved on submit
  □ Backend 500 / timeout  □ Duplicate submit (double-click) — must not double-fill
CONNECTIVITY
  □ API unreachable → honest banner, cached last-known values LABELLED as stale, never silent fake data
  □ WebSocket drops → visible reconnecting state, then recovery    □ Slow network → skeletons, not blank
DATA
  □ Missing crest / flag / player photo → graceful fallback, never a broken image
  □ Very long team names → no overflow, no overlap    □ Unknown player id → plain text, not a 404 link
DEVICE
  □ 1440 and 1920    □ narrow/laptop    □ both themes    □ keyboard-only    □ prefers-reduced-motion

═══════════════════════════════════════════════════════════
PART 5 — VERIFY (loop until all hold)
═══════════════════════════════════════════════════════════
□ Two browsers = two DIFFERENT identities, credits and positions. Zero pravatar in the built output.
□ One handle everywhere — grep the build for "@vd" and "@you"; both must be gone.
□ Every edge case above screenshotted and LOOKED at; each reads intentional, none reads broken.
□ Read-out-loud: every number agrees with every other on screen, and with the API.
□ Overlap check: sibling getBoundingClientRect intersections >4px at 1440/1920/narrow, both themes = 0.
□ Zero dead links; zero fabricated values; axe 0 criticals; tick-flash still fires within 180ms.
□ Motion: every animation justified in one sentence in the ledger. Reduced-motion renders calm and static.
□ design-cop verdict + composite vs the Hyperliquid reference in design/verdicts/.
Then deploy and re-verify on the LIVE url, not localhost.
```

---

## Note for Sushant

I can't see your localhost — that's your machine, not something my sandbox can reach. But the identity bug
is visible in the deployed HTML and in the source, and it's worse than "same photo": there are **two**
hardcoded identities (`@vd` in `fixtures.ts`, `@you` in `terminal.ts`), so one user reads as two different
people depending on which panel you look at. That's a read-out-loud contradiction live right now.

**One push-back on "add more GSAP".** Your own design law says trading surfaces should feel *fast and calm* —
adding motion to a terminal usually makes it feel cheaper, not better. The 5/10 is a **hierarchy** problem:
you already have the density, but every panel carries equal visual weight, so the eye has nowhere to land.
The prompt spends its motion budget only where animation communicates a state change — above all the trade
fill, which is the money moment of your demo and currently has almost nothing.

The edge-case matrix is the part I'd not skip. Your current real state — feed connected, market pre-match —
is exactly the kind of state that looks broken if nobody designed it, and it's the state a judge will see
if the Final hasn't kicked off.
