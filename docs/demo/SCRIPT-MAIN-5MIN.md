# NINETY — main demo video script (5:00)

Companion to the separate **2-minute live terminal capture** (ARG v ESP Final). This is the product film.
Spoken word count ≈ 720 (≈150 wpm). Read it warm and unhurried — confidence, not hype.
**Rule for the whole recording: never say "live" over a replay.** Precision is the brand.

---

## 0:00 – 0:30 · THE HOOK (fan-first, no jargon)

**VISUAL:** Cold open on the scroll-scrub goal sequence. Then a phone-shaped crop of a real match.
No logo yet.

> Ninety minutes. That's how long a football match is — and for those ninety minutes, hundreds of millions
> of people are watching with a phone in their hand.
>
> And there is almost nothing to *do* with it. You can check a score. You can read a stat. But you can't
> say "I think Argentina win this" and have it mean anything.
>
> Sportsbooks are closed, and legally walled. Stats apps are beautiful — and read-only.
>
> So we built the missing thing.

**VISUAL:** Wordmark lands. **NINETY.**

> Every match is a market for ninety minutes.

---

## 0:30 – 2:30 · THE PRODUCT (the two minutes — consumer power)

**VISUAL:** Open on `/play` — Next Goal. Tap it. One tap, instant.

> Here's the simplest version. Who scores next — Argentina, Spain, or nobody? One tap. Free. No account,
> no deposit, no jargon. You build a streak across all 104 games.
>
> That's the front door, and it's deliberately something your dad could use.

**VISUAL:** Telegram — an EarlyWhistle card lands in a chat with a price move.

> If you're not even in the app, the app comes to you. Our Telegram bot posts the moment something matters —
> a goal, a red card, a swing — and explains what the market thinks now, in one line.

**VISUAL:** Cut to the terminal. The Final. Prices visible.

> And underneath that simplicity is a real exchange.
>
> This is the World Cup Final. Spain, draw, Argentina — and those numbers are probabilities. Sixty-one
> means the market gives that side a sixty-one percent chance. Price *is* probability. That's the whole
> mental model, and once you have it, everything else reads.

**VISUAL:** The Momentum River. Then the goal → halt → reprice sequence plays.

> Then the game moves. A goal goes in — the market halts, the way a real exchange halts. Prices land at
> the new reality. And the Booth, our AI commentator, tells you what just happened and what it did to the
> price.
>
> Watch it: forty-one to sixty-one on one goal. That's the crowd changing its mind, drawn as a line.

**VISUAL:** Trade panel — a fill. Then Moments.

> You trade it with play money. A thousand free credits every match. No deposits, no payouts, ever — not
> as a limitation, but because we wanted this open to every fan in every country.
>
> And the biggest swings mint as Moments — the goal that moved the market, yours to keep.

**VISUAL:** Quick sweep — board, player page, team page, search.

> Every one of the 104 fixtures. All 48 teams, every player, with real squads, real standings, real
> results — each one its own page, one search away.

---

## 2:30 – 3:30 · TxLINE, HEAVILY

**VISUAL:** Screen recording of the code / the endpoint map. Then the Swagger docs.

> None of this exists without TxLINE, and we used it to the bone.
>
> Eight typed endpoint wrappers: fixtures; four score endpoints including the live SSE stream and Merkle
> stat-validation; and three odds endpoints. Everything that *moves* during a match — scores, goals, halts,
> prices, results — is TxLINE-owned. Our own baked data only holds what sits still.

**VISUAL:** The synthesis diagram — O/U → Poisson → λ; AH → Skellam → supremacy; → Dixon-Coles → H/D/A.

> And here's the part we're proudest of. The free feed carries Over/Under totals and Asian handicap — both
> two-outcome books. It never ships a match-result market. But Ninety trades Home, Draw, Away.
>
> So we recover it. Invert the Poisson on Over/Under to get expected goals. Invert the Skellam on the
> handicap to get supremacy. Feed both into a Dixon-Coles grid, and out comes a real Home-Draw-Away board.
>
> Thirty point six, forty-eight point nine, twenty point five — the actual Final, priced from the actual
> feed. Twenty-seven tests behind it. And when the books are too thin to be honest, we leave it unpriced
> rather than print a fake thirty-three, thirty-three, thirty-three.

---

## 3:30 – 4:15 · SOLANA — LOAD-BEARING, NOT DECORATIVE

**VISUAL:** The subscribe transaction on Solana Explorer. Then `proof.rs`.

> Solana isn't a logo on this project. It's the gate.
>
> Access to the feed is unlocked by an on-chain subscription — a real transaction on devnet. And match
> results are verified on-chain: our Anchor program checks TxLINE's signed statistics before a market can
> settle. There is no admin override. Nobody is trusted; everything is proven.

**VISUAL:** `SETTLEMENT_LIVE = false` in the source.

> And then we found something. TxLINE's proof doesn't bind match *finality* on-chain — which means a
> mid-match sequence could be used to forge a settlement.
>
> So we proved it forgeable, and we turned settlement off. It's a compile-time constant. Flipping it takes
> a source change and a redeploy.
>
> We'd rather ship something honest and unfinished than something trusted and forgeable. That decision is
> the character of this whole project.

---

## 4:15 – 5:00 · THE FUTURE — AND WHY WE'RE NOT STOPPING

**VISUAL:** The docs roadmap page. Then the landing finale with the wordmark.

> Twelve days. A hundred and seventy-seven commits. Seventy-nine architecture decision records — every call
> written down. A single-writer LMSR engine, a Redis-Streams bus, a Python quant worker, thirty API
> endpoints with live docs, and an Anchor program.
>
> All of it running on zero dollars — free tiers end to end.

**VISUAL:** Roadmap items appearing.

> Here's where it goes. The full live universe: every fixture, real wallet identity, Moments as compressed
> NFTs. The pundit bot with text-to-speech, so the match talks to you. Depth, lineups, expected goals, and
> a native mobile app.
>
> Then the part that compounds: a play-money track record of who actually predicts football best. No
> bookmaker can farm that data, because nobody plays honestly when their own money is on the line. That's
> the asset — and it's the foundation of a clean, legal top-of-funnel that a sportsbook can never build for
> itself.
>
> If we win this, that money goes straight back in. And if we don't, we're building it anyway — the World
> Cup ends, but there's a match every single day.

**VISUAL:** Wordmark. Price ticking.

> Ninety. Every match is a market for ninety minutes.
>
> Priced by TxLINE. Proven on Solana. Play money, forever.

---

## Recording notes

- **Pace:** 5:00 is tight. Rehearse once with a timer; if long, cut from 2:30–3:30, never from 0:30–2:30.
- **The two minutes on product (0:30–2:30) are the ones the first judging criterion scores.** Do not rush
  them to get to the architecture — the temptation will be strong and it is the wrong instinct here.
- **Honesty:** if the terminal in this film is a replay, the on-screen label must say so. The separate
  2-minute Final capture is where "live" gets said out loud.
- **Show, don't narrate.** Any sentence describing what's already visible on screen can be cut.
- Record the halt/reprice beat in one continuous take — cutting away from it kills it.
