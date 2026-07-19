# Terminal prompt — FINAL DAY. Stop building. Ship the submission.

Paste this. Read `docs/FINAL-DAY.md` for the reasoning behind the order.

---

```
Deadline is 2026-07-19 23:59 UTC. Everything below is ordered by risk of LOSING the hackathon, not by
effort. Do them in order. Do not start anything not on this list. When a step is done, say so and move on.

CONTEXT THAT CHANGES THE PRIORITIES:
The rules say a demo video is an ABSOLUTE requirement to pass screening, that judging leans HEAVILY on the
video, and that matches end before review so judges likely will NOT see the site live. They also say
mockups are AUTOMATICALLY DISQUALIFIED. Our deployed site currently shows a "PROTOTYPE — Fixture data"
banner over eight simultaneous fake live matches. TxLINE is now genuinely live. That banner is no longer
honest-and-safe; it is now our biggest disqualification risk.

── STEP 1 (1 hour) — MAKE THE REAL DATA THE FIRST THING A JUDGE SEES
Land the pre-match odds fold-in: on boot, fetch fixtures/snapshot + odds/snapshot for upcoming WC fixtures
and publish once, so cortex prices the Final NOW and a market exists before kickoff.
Success = GET /markets returns the Final with real TxLINE-derived H/D/A ≈ 30.58 / 48.92 / 20.50, and the
terminal shows it without the user doing anything. Screenshot the payload — it is our best artifact.
Also: remove the eight fake simultaneous "live" matches from the default terminal view. They are the single
strongest visual signal of "mockup" on the site.

── STEP 2 (10 min) — REWRITE THE BANNER TO LEAD WITH WHAT IS REAL
Replace "Prototype — Fixture data …" with something like:
  "Live TxLINE data — the World Cup Final priced from the real feed. Play-money: no deposits, no payouts."
Keep an honest note where the replay tape is shown, but stop leading with the word Prototype. Grep the app
for "Prototype" and "Fixture data" and fix every instance.

── STEP 3 (20 min) — COMMIT AND PUSH
Days of work are uncommitted. Secret-scan first (no jwt, apiToken, bot token, keypair, .env). Commit, push.
Verify the public repo contains what the video will show. Re-check README counts against
`git rev-list --count HEAD` and `ls docs/adr/ADR-*.md | wc -l` and fix if drifted.

── STEP 4 (30 min) — WRITE THE SUBMISSION ARTIFACTS (they ask for these explicitly)
Create docs/SUBMISSION-TECHNICAL.md containing:
  a) Core idea in three sentences.
  b) TXLINE ENDPOINTS USED — they ask for this by name. List all eight wrappers (F1 fixtures; S1 scores
     snapshot, S2 updates, S3 SSE stream, S4 stat-validation; O1 odds snapshot, O2 updates, O3 SSE stream)
     plus the on-chain flow: guest JWT → subscribe (devnet) → token/activate.
  c) MONETIZATION — we currently score ZERO on this criterion because the pricing page says "one price:
     free". Write two sentences: B2B clean legal top-of-funnel for operators; the play-money prediction
     track record as a data asset; premium tiers for depth/leagues.
  d) TXLINE FEEDBACK (they ask, and it is scored goodwill):
     LIKED: free WC tier, one normalised schema across competitions, devnet activation was clean.
     FRICTION 1: the free feed carries Over/Under + Asian handicap but no 1X2 — we invert Poisson and
       Skellam and run Dixon-Coles to recover a match-result book.
     FRICTION 2: a devnet txSig activates exactly ONCE, so a client that re-activates on 401 dies
       permanently; renewing the guest JWT is the correct path and is easy to miss.
     FRICTION 3: the settlement proof does not bind match finality on-chain — we proved it forgeable and
       hard-gated settlement off rather than ship it.

── STEP 5 — THE VIDEO IS THE SUBMISSION. Prepare the site for it.
Judging criterion #1 is whether a MAINSTREAM, NON-TECHNICAL FAN would use this. So the demo must open with
delight, not with the trading terminal. Make sure these three work flawlessly, in this order:
  1. Next Goal (/play) — one tap, no jargon, instantly understandable.
  2. The Telegram card landing in a real chat (needs B6 — BotFather, 2 minutes, do it now).
  3. THEN the terminal: the Final priced from live TxLINE, the halt/reprice moment, on-chain proof.
Walk docs/demo/SCRIPT-5min.md end to end on the production build and fix anything that stumbles. Every beat
must work on the first take.

── STEP 6 (only if time remains) — TTS on the Telegram bot. The track says "bonus points for TTS".

DO NOT START: the component waves, the parallax finale, more GSAP, the 9/10 loop, entity-link polish.
All of it is worth zero if the video does not exist. If you are unsure whether to build something, the
answer today is no.
```

---

## The one-line version

**Everything you build today is worth zero if the video does not get filmed.** The rules say it is an
absolute screening requirement, that judging leans heavily on it, and that judges probably will not see your
site live because the tournament will be over. Land the real odds, fix the banner, commit, then film.
