# FINAL DAY — where we lose this, in order

Deadline: **19 July 2026, 23:59 UTC.** Hours, not days. Ranked by risk of losing, not by effort.

---

## 1. NO DEMO VIDEO = AUTOMATIC FAILURE. Nothing else matters until this exists.

The rules: *"Demo Video (Up to 5 Minutes) … **Absolute requirement to pass initial screening**"* and
*"Submissions will be evaluated **heavily** based on the demo video."* Plus: *"the matches will end after
the submission deadline, so there may not be live activity during review."*

That last line is the whole game. **The judges will most likely never see your site working live.** The
video *is* the product as far as scoring goes. You have `docs/demo/SCRIPT-5min.md` and `SHOT-LIST.md`
already written. Everything below is worth less than pressing record.

**If you do one thing today: film it.**

## 2. "PROTOTYPE — Fixture data" could get you auto-disqualified

The rules: *"Products must be functional, **not mockups**"* and *"Submissions consisting only of pitch
decks, wireframes, mockups, or non-working concepts will be **automatically disqualified**."*

A judge opens `ninety-nu.vercel.app`, sees a banner saying **"Prototype — Fixture data"** over eight
simultaneous fake live matches, and has grounds to file you under mockup. That banner was honest and correct
when nothing was live. **It is now actively dangerous, because TxLINE IS live.**

Fix, in priority order:
- **Land the pre-match odds fold-in.** This is no longer a nice-to-have — it is existential. A judge must
  open the terminal and see the World Cup Final priced at the real TxLINE-derived **30.58 / 48.92 / 20.50**.
  Real numbers, real source, visible in five seconds.
- **Rewrite the banner** to lead with what IS real: *"Live TxLINE data · World Cup Final priced from the
  real feed · play-money."* Keep an honest note about the replay tape, but stop leading with "Prototype".
- Remove the eight fake simultaneous live matches from the default view. They are the single strongest
  visual signal of "mockup" on the entire site.

## 3. You score ZERO on a whole judging criterion right now

Criterion: *"**Commercial & Monetization Path** — Is there a clear, viable product utility or potential
business and monetization model?"*

Your pricing page says **"One price: free. There is no second tier."** Charming, on-brand — and it answers
this criterion with nothing. You already have the real answer in deck slide 8; it just is not in the
submission:
- **B2B**: a clean, legal top-of-funnel a sportsbook can never build for itself.
- **The data asset**: a play-money track record of who actually predicts football best — no book can farm it.
- **Premium tiers**: deeper stats, more markets, custom leagues (TxLINE itself sells this way).
Put two sentences of this in the technical documentation and one line in the video. It costs five minutes
and moves a criterion from 0 to a real score.

## 4. You are optimising for the wrong judge

Criterion #1 is: *"Would a **mainstream, non-technical sports fan** regularly open and use it?"*

Nearly all recent effort went into `/terminal` — Sofascore density, Hyperliquid craft, LMSR, tick latency.
That is a *trader* aesthetic, and it is the wrong opening for this criterion. Your genuinely
fan-accessible pieces are **Next Goal** (`/play`), **Moments**, and the **Telegram bot** — and the track's
own example ideas are a sweepstake, an AI pundit bot, and a Hi-Lo game. You already built the pundit bot.

**Restructure the video: open with the simple delight, then reveal the depth.**
Next Goal in one tap → a Telegram card landing in a chat → *then* "and underneath it is a real exchange" →
the halt/reprice moment → on-chain proof. Leading with the terminal loses the first thirty seconds with the
judge who is scoring criterion #1.

## 5. Free points you have not collected

- **TTS on the Telegram bot** — the track literally says *"Bonus points for TTS functionality."* Your deck
  already promises it. If there is an hour left, this is the cheapest scoring in the whole brief.
- **The TxLINE feedback field.** They ask what you liked and where you hit friction, and they mean it
  ("so our team can jump in and fix it"). You have the best possible material, and it doubles as proof of
  depth:
    · The free-tier WC access and the single normalised schema were genuinely good.
    · **Friction 1:** the free feed carries Over/Under and Asian handicap but no 1X2, so we had to invert
      Poisson and Skellam and run Dixon-Coles to recover a match-result book.
    · **Friction 2:** a devnet `txSig` activates exactly once, so any client that re-activates on a 401
      dies permanently. Renewing the guest JWT is the right path and it is easy to miss in the docs.
    · **Friction 3:** the settlement proof does not bind match finality on-chain — we proved it forgeable
      and fail-closed rather than ship it.
  That third one is the most memorable thing in your entire submission. Lead your feedback with it.
- **The endpoint list.** They explicitly ask for *"a list of the specific TxLINE endpoints you used."*
  You have exactly eight wrappers — F1, S1–S4, O1–O3 — plus the on-chain subscribe/activate flow. That is a
  ready-made, impressive answer. Write it out.

## 6. Commit the repo

Days of work still sit uncommitted. *"Include a demo video and **public repo**."* If a judge clones it,
they must get what the video shows. Secret-scan, commit, push. Also fix the stale README numbers if they
have drifted again since 177 commits / 79 ADRs.

---

## The order for today

1. **Pre-match odds live in the terminal** (kills the mockup risk) — 1 hour
2. **Rewrite the prototype banner** — 10 minutes
3. **Commit + push** — 20 minutes
4. **FILM THE VIDEO**, fan-first structure — 2 hours
5. **Technical doc**: endpoints used + monetization + the feedback answer — 30 minutes
6. TTS on the bot, only if time remains

Everything else — components, parallax, the 9/10 loop, more GSAP — is worth **zero** if the video does not
exist. Stop building at whatever point is needed to guarantee it gets filmed.
