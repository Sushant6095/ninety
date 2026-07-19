# NINETY — Master Product Presentation
### 10 slides · live-demo companion · Apple keynote × Hyperliquid × Figma Config

**Visual system for every slide:** dark field `#0B0D10`, surface `#14171C`, hairline `#232A33`.
Accents: up `#2BD97C`, down `#FF3D81`, halt `#FFB020`, chain `#9D6BFF`. Text `#F5F7FA` / `#97A0AF`.
Type: SF Pro / system for display + UI; **SF Mono, tabular-nums, for every number**. Prices one decimal.
Motion: 150–250ms ease-out. One idea per slide. Generous whitespace. Never a bullet where a number will do.

---

# SLIDE 1 — "Every match is a market for ninety minutes."

**Objective:** Land the vision in one sentence, before any feature is shown.

**Main content**
- Wordmark: **NINETY**
- Line: *Every match is a market for ninety minutes.*
- Sub: A live, play-money football exchange for the FIFA World Cup 2026 — priced by TxLINE, proven on Solana.
- Corner: TxODDS Buildathon · Consumer & Fan Experiences

**Visual hierarchy:** wordmark (96pt) → thesis line (30pt italic, `--up`) → sub (16pt `--text-lo`) → chip.
**Layout:** left-aligned lower third. Upper two-thirds carries the live Momentum River rising across the frame.
**Screenshots:** the landing hero, scrubbed to the goal frame.
**Diagram:** none. One line only.
**Icons:** none. Restraint is the statement.
**Animation:** River draws left→right (1400ms), wordmark SplitText per-letter rise, thesis fades at +400ms.

**Speaker notes**
> Ninety minutes. That's how long a football match lasts — and for those ninety minutes, hundreds of
> millions of people watch with a phone in their hand and nothing to do with it. Ninety turns every match
> into a live market. Not a scoreboard you read. A market you can act on.

**Key talking points:** price = probability · play-money forever · built for the fan, not the operator.
**Transition:** *"To explain why this doesn't exist yet, look at what a fan actually has today."*

---

# SLIDE 2 — The gap nobody filled

**Objective:** Prove the market gap is structural, not a feature gap.

**Main content — three columns, one verdict each**

| | What it gives | What it withholds |
|---|---|---|
| **Sportsbooks** | Live prices | Closed books, legal walls, house-vs-you, KYC, excluded countries |
| **Stats apps** (Sofascore, FotMob, Flashscore) | Beautiful, dense, live | **Read-only.** You cannot express a view |
| **Fantasy** | Skin in the game | Weekly cadence. Dead during the ninety minutes that matter |

**The gap:** *No live, honest, actable market that any fan anywhere can open mid-match.*

**Visual hierarchy:** three equal cards → one full-width verdict bar beneath in `--up`.
**Layout:** 3-up cards, then a single line spanning full width.
**Screenshots:** small, desaturated crops of each category — familiar at a glance, not legible in detail.
**Diagram:** a 2×2 — *live* vs *actable*. Three logos cluster in the wrong quadrants; Ninety sits alone in live+actable.
**Icons:** lock (sportsbooks), eye (stats), calendar (fantasy).
**Animation:** cards stagger in 60ms apart; the 2×2 plots Ninety last with a 180ms flash.

**Speaker notes**
> Fans switch apps constantly, and it isn't laziness — each app is structurally incapable of the others' job.
> Sportsbooks have the live price but are closed and legally walled. Stats apps are gorgeous and completely
> read-only. Fantasy has stakes but runs weekly, so it's asleep during the exact ninety minutes that matter.
> Nobody is serving the fan who just wants to say *"I think Argentina win this"* and have it mean something.

**Talking points:** this is a structural gap, not a UX gap · play-money is what unlocks every jurisdiction.
**Transition:** *"So we built the thing that sits in the empty quadrant."*

---

# SLIDE 3 — The ecosystem: one loop, six surfaces

**Objective:** Show the whole product as a single connected system, not a feature list.

**Main content — the 90-minute loop**
`GOAL → HALT → REPRICE → THE BOOTH → SETTLE`
- **Goal** — TxLINE ships the event
- **Halt** — the market freezes, like a real exchange
- **Reprice** — probability lands at the new reality
- **The Booth** — AI explains the swing in one line
- **Settle** — verified on-chain, no admin path

**Surfaces around the loop:** Momentum River · Trade H/D/A · Moments · Next Goal · Telegram bot · Entity pages

**Visual hierarchy:** the five-step loop dominates centre; surfaces orbit as small chips.
**Layout:** horizontal 5-step spine, chips in a row beneath.
**Screenshots:** the halt sequence at ~0.7s — amber HALTED over the River.
**Diagram:** circular flow with TxLINE feeding in at Goal and Solana closing at Settle.
**Icons:** ball, pause, arrows-diverge, waveform, seal.
**Animation:** the loop plays once on entry, each step lighting in sequence (200ms apart); halt step flashes amber.

**Speaker notes**
> Everything in Ninety is one loop. The ball hits the net, the market halts the way a real exchange halts,
> the price lands at the new reality, our AI Booth tells you what just happened, and the result settles
> on-chain. Every surface in the product is just a different window onto that loop.

**Talking points:** the halt is the emotional beat · the Booth makes probability legible to a non-technical fan.
**Transition:** *"Here's what that looks like as pages a fan actually opens."*

---

# SLIDE 4 — The product, page by page

**Objective:** Prove completeness — 21 routes, each with a reason to exist.

**Main content — grouped, not listed**

**Watch** — `/` landing · `/board` (all 104 fixtures, grouped, live) · `/competition` · `/bracket`
**Trade** — `/terminal` (the exchange: River, H/D/A, ticket, positions) · `/match/[id]` · `/portfolio` · `/history`
**Play** — `/play` Next Goal, free, one tap · `/moments` + `/moments/[id]` — mint the swing
**Know** — `/player/[id]` (real squads, per-90 stats, the *Ninety index*) · `/team/[code]` (47 stadiums, standings, form) · ⌘K entity search across teams, players, matches, competitions, managers, venues
**Prove** — `/proofs` on-chain log · `/how-it-works`
**You** — `/onboarding` · `/account` · `/settings` · `/profile/[handle]` · `/leaderboard` · `/replay/[id]`

**Per-page rationale (say the ones that matter):**
- `/terminal` — the exchange. Powered by our engine + cortex prices. Inspiration: Hyperliquid's calm density.
- `/play` — the front door for a non-technical fan. Zero jargon, zero risk, one tap.
- `/player/[id]` — football-data squads + API-Football per-90s, plus **Market impact**: the price swing each of that player's goals caused. No stats site can show that, because they don't run a market.
- `/proofs` — every settled market's on-chain evidence. Real signatures only; we deleted the fabricated ones.

**Layout:** six labelled clusters in a bento grid, each with a micro-screenshot.
**Screenshots:** terminal (hero), board, player page, Telegram card, Next Goal, proofs.
**Diagram:** a user-journey ribbon: *watch → react → act → keep → prove*.
**Animation:** bento cells reveal on a 40ms stagger; hovering a cell lifts it 2px.

**Speaker notes**
> Twenty-one routes, and every one has a job. Watch, trade, play, know, prove, you. The important thing is
> the ramp: a fan lands on Next Goal and it's one tap with no jargon — and if they want depth, the same data
> is behind a professional terminal. Most products pick one audience. The loop lets us serve both.

**Transition:** *"None of it works without the machine underneath."*

---

# SLIDE 5 — Architecture: a real distributed system on $0

**Objective:** Establish engineering credibility in thirty seconds.

**Main content**
- **Fastify API** — 30 endpoints, live Swagger at `/docs`
- **Single-writer LMSR engine** — journal-then-ack; exactly one writer owns market state, enforced by lease at boot
- **Redis Streams bus** — two planes (domain events + `sys.*` signals). No service calls another directly
- **cortex (Python)** — the quant worker: de-vig, Poisson/Skellam inversion, Dixon-Coles
- **ingest / jobs workers** — TxLINE consumption · settlement saga · the Booth · EarlyWhistle
- **Anchor program (Solana)** — on-chain proof verification
- **Postgres (Aiven) + Valkey (Aiven) + Fly + Vercel + Solana devnet** → **$0**

**Tradeoffs, stated plainly**
- *Single writer over distributed consensus* — one match is low-throughput; correctness beats scale here
- *Bus over direct calls* — services stay replaceable; the ingest worker can die without taking prices down
- *Baked static data over runtime fetch* — free-tier rate limits (100/day, 10/min) make per-request calls impossible
- *Python for quant, TypeScript for everything else* — scipy is worth the polyglot cost

**Visual hierarchy:** the diagram is the slide. Text is annotation.
**Layout:** left-to-right flow: TxLINE → ingest → bus → engine ⇄ cortex → API → web; Solana below; storage beneath.
**Diagram:** boxed layers with `--chain` for on-chain, `--up` for the live path, hairline for storage.
**Animation:** the live path illuminates in sequence, ending with a price ticking on the web node.

**Speaker notes**
> Under the hood this is a genuine distributed system: a single-writer engine with journal-then-ack, a
> Redis-Streams bus so nothing calls anything directly, a Python quant worker, and an Anchor program on
> Solana. A hundred and seventy-seven commits, seventy-nine architecture decision records — every call
> written down before it was coded. And the entire live stack runs on zero dollars of free tier.

**Transition:** *"The most interesting part is what we had to do with the data."*

---

# SLIDE 6 — TxLINE: integrated to the bone

**Objective:** Prove deep, non-trivial use of the sponsor's data — the technical centrepiece.

**Main content**

**Eight typed wrappers, verified live on devnet**
`F1` fixtures · `S1` scores snapshot · `S2` scores updates · `S3` **scores SSE stream** · `S4` stat-validation
`O1` odds snapshot · `O2` odds updates · `O3` **odds SSE stream**

**Auth is on-chain:** guest JWT → **Solana subscribe transaction** → activate → `X-Api-Token`.
The data feed is unlocked by a transaction. The chain is the gate, not a logo.

**The two-source law (ADR-051):** TxLINE owns everything that **moves** — scores, goals, halts, prices,
results. Baked data owns only what **sits still** — flags, crests, the 104-fixture skeleton.

**The synthesis — our proudest engineering**
> The free feed carries **Over/Under** and **Asian handicap** only. Both two-outcome. It never ships 1X2.
> But Ninety trades Home / Draw / Away.
1. Invert the **Poisson** CDF on Over/Under → total-goals **λ**
2. Invert the **Skellam** on the handicap → **supremacy** (λ_home − λ_away)
3. Feed both into a **Dixon-Coles** bivariate-Poisson grid → **P(H) / P(D) / P(A)**

**Live proof:** the World Cup Final — Spain **30.58** · Draw **48.92** · Argentina **20.50**.
27 tests. Degenerate books stay **unpriced** — never a fabricated 33/33/33.

**Why streaming, not polling:** SSE gives event-time arrival; polling adds average half-interval latency and
burns rate limit. Ingest fans SSE into the bus once; every consumer reads from Redis. One upstream
connection, N consumers, no thundering herd.

**Layout:** left = endpoint grid + auth chain; right = the three-step synthesis pipeline ending in the real numbers.
**Diagram:** O/U ─Poisson→ λ ; AH ─Skellam→ supremacy ; both ─Dixon-Coles→ H/D/A.
**Animation:** the pipeline resolves left→right; the final three numbers count up and flash once.

**Speaker notes**
> We used TxLINE to the bone. Eight typed wrappers including both SSE streams, and the auth itself is
> on-chain — a Solana transaction unlocks the feed. But here's the part I'd point at: the free feed never
> ships a match-result market. It carries Over/Under and Asian handicap, both two-outcome books. We trade
> Home-Draw-Away. So we recover it — invert the Poisson for expected goals, invert the Skellam for
> supremacy, run a Dixon-Coles grid, and out comes a real 1X2 board. Thirty point six, forty-eight point
> nine, twenty point five — that's the actual Final, priced from the actual feed.

**Transition:** *"And when the market has to settle, that's where Solana stops being decoration."*

---

# SLIDE 7 — Solana: load-bearing, and the finding that proves it

**Objective:** Show blockchain as necessary infrastructure — and demonstrate integrity.

**Main content**
- **Access is on-chain** — the TxLINE subscription is a real devnet transaction. No transaction, no feed.
- **Results are verified, not trusted** — the Anchor program (`proof.rs`) checks TxLINE's signed statistics before a market can settle. **There is no admin result path, by design.**
- **Identity** — embedded wallets, so a fan never touches a seed phrase; wallet-connect available for the crypto-native. `/auth/embedded/start` · `/auth/challenge` · `/auth/connect`
- **Ownership** — Moments (the swing that moved the price) mint as compressed NFTs
- **Why Solana** — settlement cost and finality make per-match, per-moment on-chain writes economically sane. On most chains this product's unit economics don't close.

**⚠ The forge finding**
> We discovered TxLINE's proof **does not bind match finality on-chain** — a mid-match sequence could be
> used to forge a settlement. We proved it forgeable and turned settlement **off**:
> `pub const SETTLEMENT_LIVE: bool = false;` — a **compile-time constant**, first statement of the settle
> handler. Flipping it requires a source change, a rebuild and a redeploy.

**Layout:** left column = the four roles; right = the code callout in a bordered `--halt` chip.
**Screenshots:** the real subscribe tx on Solana Explorer; `proof.rs`; the constant in source.
**Animation:** the code line types once; the halt border pulses a single time, then rests.

**Speaker notes**
> Solana is load-bearing here, not a sticker. Access to the feed is gated by a real on-chain transaction,
> and results are verified on-chain — our program checks TxLINE's signed stats, and there's no admin
> override. Then we found something. Their proof doesn't bind match finality, which means a mid-match
> sequence could forge a settlement. So we proved it forgeable and switched settlement off — compile-time,
> not a config flag. We'd rather ship something honest and unfinished than something trusted and forgeable.

**Talking points:** this is the single most memorable thing in the submission — say it slowly.
**Transition:** *"That same instinct shows up in how the thing looks."*

---

# SLIDE 8 — Design: intentional, not assembled

**Objective:** Prove the interface was designed, with rules, not decorated.

**Main content**
- **Two references, one product.** *Sofascore* for information density and football texture. *Hyperliquid*
  for calm, craft and numeric precision. Ninety must beat both by being the only one that is a live market.
- **Colour is law.** Every colour is a token in `tokens.css`. Raw hex in a component is a **build bug**.
  Green up, pink down, amber **only** for halts, violet **only** for on-chain.
- **Numbers are a typeface.** SF Mono, tabular-nums, one decimal. Prose is the system font. That single
  split is the difference between a terminal and a log file.
- **The 180ms tick flash** fires on every price change — and must re-fire on rapid same-direction ticks.
  A silent tape during a rally is a bug, not a detail.
- **Motion has a job.** GSAP is primary (ScrollTrigger, SplitText); Framer for micro-interactions. The
  landing may be **alive** — animated gradient, scroll choreography. Trading surfaces are **fast and calm**;
  no gradient may touch a live-price surface, because GPU contention breaks the 150ms tick path.
- **Buy the generic, build the specific.** Primitives come from shadcn → magicui → 21st.dev, re-skinned to
  tokens, each logged in `PROVENANCE.md`. We hand-build only six things: the **Momentum River**, MatchCard,
  PriceChip, the trade ticket, ProofBadge, and the Booth.
- **Verification is a law, not a habit.** A screen is not done until it has been screenshotted and *looked
  at*, and passed the **read-out-loud test** — enumerate every text element; if any two disagree, it ships
  broken. That test caught MARKET OPEN over a halted chart, three clocks at once, and a team live in two
  matches.
- Light and dark from one component set. `prefers-reduced-motion` honoured everywhere, GSAP included.

**Layout:** two-column — principles left, a before/after or token swatch strip right.
**Diagram:** the token palette as labelled chips; a type-scale specimen.
**Animation:** a price chip demonstrating the up-flash, live on the slide, once.

**Speaker notes**
> Every colour in the product is a variable — a raw hex in a component fails the build. Numbers are
> monospace and tabular; prose is the system font. That one split is most of why it reads like an exchange
> instead of a dashboard. And a screen isn't finished until someone has read every element out loud and
> confirmed nothing contradicts anything else. That test has caught more real bugs than every tool we ran.

**Transition:** *"Which brings us to where this goes after today."*

---

# SLIDE 9 — Roadmap: the tournament is the beginning

**Objective:** Show a credible, compounding path — and answer the commercial question.

**Main content**

**Now (shipped)** — live TxLINE devnet ingest · 1X2 synthesis · the halt loop · 21 routes · entity pages ·
⌘K search · Telegram bot with inbound commands · on-chain verification · $0 stack

**Next (weeks)** — all 104 fixtures live · **AI Pundit Bot with TTS** — the match talks to you · depth tabs
(lineups, xG, H2H) · Moments as cNFTs · real wallet identity · native mobile

**Then (months)** — personalised feeds (your teams, your players) · social + creator layer: shareable
Moments, rivalries, group leagues (the sweepstake, automated) · a prediction engine improved by its own
record · intelligent notifications that learn what you care about · wearables for the halt beat

**The business — three doors**
1. **B2B top-of-funnel** — a clean, legal, play-money funnel an operator can never build for itself
2. **The data asset** — a play-money track record of *who actually predicts football best*. No bookmaker can
   farm this, because nobody plays honestly when their own money is at risk. This compounds every match.
3. **Premium depth** — deeper stats, more competitions, custom leagues (exactly how TxLINE itself sells)

**Layout:** three horizontal time bands, then a separate three-card business row.
**Diagram:** a widening funnel — one tournament → every league → the prediction graph.
**Animation:** bands wipe in left→right; the business row rises last.

**Speaker notes**
> The World Cup ends, but there's a match every single day. Next is the full live universe and the pundit
> bot with text-to-speech. Then the part that compounds — a play-money record of who actually predicts
> football best. No bookmaker can collect that data, because nobody plays honestly when their own money is
> on the line. That's the asset, and it's the foundation of a clean, legal top-of-funnel that an operator
> can never build for itself.

**Transition:** *"Let me show you the product itself."*

---

# SLIDE 10 — Demo guide *(your slide, not theirs — keep on screen or in your notes)*

**Objective:** Maximum impact in the live walkthrough.

**Order of operations — do not improvise this**
1. **`/play` — Next Goal (20s).** One tap. No jargon. *This is the criterion-one moment: a mainstream fan
   gets it instantly.* Say: *"my dad can use this."*
2. **Telegram card (20s).** Show a card landing in a real chat. *"The app comes to you."*
3. **`/terminal` — the Final (60s).** Point at the price. Say **price is probability** and let it sit.
4. **⏸ PAUSE HERE — the halt (30s).** Play goal → halt → reprice in one continuous take. **Do not talk over
   it.** This is the single biggest wow moment in the product; the amber freeze does the work.
5. **The Booth (15s).** One line of AI commentary tied to the swing it explains.
6. **Trade (20s).** Place one. Show the fill, the position, the P&L. *"A thousand free credits, every match."*
7. **`/player/[id]` (20s).** Real squad data — then **Market impact**: the price swing this player's goal
   caused. *"No stats site can show you this, because they don't run a market."*
8. **`/proofs` → Solana Explorer (25s).** Click through to a real transaction. Then the forge finding and
   `SETTLEMENT_LIVE = false`. **Slow down here.** This is your integrity moment.
9. **Swagger `/docs` (10s).** Thirty endpoints, live. Proof it's a system, not a screen.
10. **Close on the landing finale** — the wordmark. Deliver the closing line.

**Where to explain what:** backend during step 3 (while the terminal loads) · blockchain at step 8, never
earlier · TxLINE synthesis at step 3 when the H/D/A numbers are visible on screen.

**Rules for the demo**
- **Never say "live" over a replay.** If the tape is a replay, the label says so and so do you. Precision is
  the brand — and it's the same instinct as the fail-closed settlement.
- If something breaks, name it and move on. This audience respects composure and has seen every demo gremlin.
- Silence after the halt. Resist filling it.

---

# PRESENTATION SCRIPT — 8 to 10 minutes

**[SLIDE 1 · 0:00–0:45]**

> Ninety minutes. That's how long a football match lasts — and for those ninety minutes, hundreds of
> millions of people are watching with a phone in their hand.
>
> And there's almost nothing to do with it. You can check a score. Read a stat. But you can't say
> "I think Argentina win this" and have it mean anything.
>
> So we built Ninety. Every match is a market for ninety minutes. A live, play-money football exchange for
> the World Cup — priced by TxLINE, proven on Solana.

**[SLIDE 2 · 0:45–1:45]**

> Fans switch between apps constantly, and it isn't laziness — each one is structurally incapable of the
> others' job. Sportsbooks have a live price, but they're closed, legally walled, and the house is on the
> other side of your trade. Stats apps like Sofascore are genuinely beautiful and completely read-only.
> Fantasy has stakes, but it runs weekly, so it's asleep during the exact ninety minutes that matter.
>
> Nobody serves the fan who just wants to express a view, live, and have it mean something. That's a
> structural gap, not a design gap. And play-money is what lets us fill it in every country at once —
> no deposits, no payouts, ever.

**[SLIDE 3 · 1:45–2:30]**

> Everything in Ninety is one loop. The ball hits the net. The market halts — the way a real exchange halts.
> The price lands at the new reality. Our AI Booth explains the swing in one line. And the result settles
> on-chain.
>
> Every surface in the product is a different window onto that loop: the Momentum River, the trade ticket,
> Moments, the Next Goal game, the Telegram bot, player and team pages.

**[SLIDE 4 · 2:30–3:30]**

> Twenty-one routes, and each one has a job — watch, trade, play, know, prove.
>
> The important thing is the ramp. A fan lands on Next Goal: who scores next, one tap, no jargon, no risk.
> If they want depth, the exact same data sits behind a professional terminal. Most products pick one
> audience. The loop lets us serve both without compromising either.
>
> And on a player page we show something no stats site can: the price swing that player's goal actually
> caused. Because we're the only ones running a market.

**[SLIDE 5 · 3:30–4:30]**

> Under the hood this is a real distributed system. A single-writer LMSR engine with journal-then-ack —
> exactly one writer owns market state. A Redis-Streams bus, so no service ever calls another directly. A
> Python quant worker. Thirty API endpoints with live documentation. An Anchor program on Solana.
>
> A hundred and seventy-seven commits, seventy-nine architecture decision records — every significant call
> written down before it was coded. And the entire live stack runs on zero dollars of free tier.

**[SLIDE 6 · 4:30–6:00]** *(the technical centrepiece — take your time)*

> We used TxLINE to the bone. Eight typed endpoint wrappers, including both server-sent-event streams for
> scores and odds. Streaming rather than polling, because polling costs you half an interval of latency on
> average and burns rate limit — we hold one upstream connection and fan it into the bus, so every consumer
> reads from Redis.
>
> The auth is itself on-chain: a guest token, a Solana subscribe transaction, then activation. The chain
> unlocks the data.
>
> But here's the part I'd point at. The free feed never ships a match-result market. It carries Over/Under
> totals and Asian handicap — both two-outcome books. We trade Home, Draw, Away.
>
> So we recover it. We invert the Poisson on Over/Under to get expected goals. We invert the Skellam on the
> handicap to get supremacy. We feed both into a Dixon-Coles grid, and out comes a real 1X2 board.
>
> Thirty point five-eight, forty-eight point nine-two, twenty point five-oh. That's the actual World Cup
> Final, priced from the actual feed. Twenty-seven tests behind it. And when the books are too thin to be
> honest, we leave it unpriced rather than print a fake thirty-three, thirty-three, thirty-three.

**[SLIDE 7 · 6:00–7:00]**

> Solana is load-bearing here, not decoration. Access to the feed is gated by a real on-chain transaction.
> Results are verified on-chain — our program checks TxLINE's signed statistics before a market can settle,
> and there is no admin override, by design.
>
> Then we found something. Their proof doesn't bind match finality on-chain, which means a mid-match
> sequence could be used to forge a settlement. So we proved it forgeable, and we turned settlement off.
> It's a compile-time constant — flipping it takes a source change and a redeploy.
>
> We'd rather ship something honest and unfinished than something trusted and forgeable. That decision is
> the character of this whole project.

**[SLIDE 8 · 7:00–7:45]**

> Every colour in Ninety is a design token — a raw hex in a component fails the build. Numbers are
> monospace and tabular; everything else is the system font. That single split is most of why it reads like
> an exchange rather than a dashboard.
>
> We buy the generic and build the specific: primitives come from component libraries, re-skinned to our
> tokens. We hand-built exactly six things — the Momentum River, the match card, the price chip, the trade
> ticket, the proof badge, and the Booth.
>
> And a screen isn't finished until someone has read every element on it out loud and confirmed nothing
> contradicts anything else. That test caught more real bugs than every automated tool we ran.

**[SLIDE 9 · 7:45–8:45]**

> The World Cup ends, but there's a match every single day.
>
> Next is the full live universe across all 104 fixtures, and the pundit bot with text-to-speech, so the
> match can talk to you while you're doing something else. Then depth, mobile, and a social layer —
> shareable Moments, group leagues, rivalries.
>
> And the part that compounds: a play-money record of who actually predicts football best. No bookmaker can
> farm that data, because nobody plays honestly when their own money is on the line. That's the asset — and
> it's the foundation of a clean, legal top-of-funnel that an operator can never build for itself.

**[SLIDE 10 / LIVE DEMO · 8:45–10:00]**

> Let me show you.
>
> *(Next Goal — one tap.)* This is the front door. No account, no jargon, no risk.
> *(Telegram.)* And if you're not in the app, the app comes to you.
> *(Terminal, the Final.)* Now the depth. These are probabilities — sixty-one means a sixty-one percent
> chance. Price is probability.
> *(Play the halt. Say nothing for three seconds.)* A goal goes in. The market halts. And it reprices.
> *(The Booth.)* And it tells you why.
> *(Trade.)* A thousand free credits, every match, for everyone.
> *(Proofs → Explorer.)* And when it settles, it settles on-chain — or, today, it doesn't settle at all,
> because we found the proof couldn't bind finality and we chose to fail closed.
>
> Ninety. Every match is a market for ninety minutes. Priced by TxLINE. Proven on Solana. Play money,
> forever.

---

## Pre-flight checklist

- [ ] Numbers verified the morning of: `echo "$(git rev-list --count HEAD) commits, $(ls docs/adr/ADR-*.md | wc -l) ADRs"`
- [ ] Slide 6's three numbers match what the terminal shows live
- [ ] Every "live" claim on screen is true at the moment you say it
- [ ] The halt sequence plays in one take, no cuts
- [ ] Solscan link opens a real transaction
- [ ] Rehearsed once with a timer — if long, cut from slide 5, never from slides 3–4 or the halt
