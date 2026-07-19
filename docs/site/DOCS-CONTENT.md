# Ninety — docs site content
### Four pages. Written to be pasted into the in-app `/docs` route (or GitBook).

---

# PAGE 1 · OVERVIEW

## Ninety

**Every match is a market for ninety minutes.**

Ninety is a live, play-money football exchange for the FIFA World Cup 2026. Every match opens a
Home / Draw / Away market priced 0–100, where the price *is* the probability. A goal halts the market, it
reprices to the new reality, an AI Booth explains the swing, and the result is verified on-chain.

**Play-money, always.** A thousand free credits every match. No deposits, no cash payouts, ever — enforced
in code, not in policy. That is what lets Ninety open to any fan in any country.

### What's live today

| | |
|---|---|
| **Live data** | TxLINE devnet, activated on-chain — real World Cup fixtures, scores and prices |
| **Markets** | 1X2 synthesised from the feed's Over/Under + Asian-handicap books |
| **Surfaces** | 21 routes — board, terminal, match, player, team, moments, bracket, proofs |
| **API** | 30 endpoints, live Swagger at `omnipitch.fly.dev/docs` |
| **Chain** | Anchor program on Solana devnet; proof verification, no admin result path |
| **Bot** | EarlyWhistle on Telegram — live cards plus inbound commands |
| **Cost** | The entire live stack runs on $0 of free tier |

### The loop

**Goal → Halt → Reprice → The Booth → Settle.** Every surface in the product is a different window onto
that one loop.

### How the price is made

TxLINE's free World Cup feed carries **Over/Under totals** and **Asian handicap** — both two-outcome books.
It never ships a 1X2 market. Ninety trades Home / Draw / Away, so we recover it:

1. Invert the **Poisson** CDF on Over/Under → total-goals λ
2. Invert the **Skellam** on the handicap → supremacy (λ_home − λ_away)
3. Feed both into a **Dixon-Coles** bivariate-Poisson grid → P(H) / P(D) / P(A)

Live example — the World Cup Final: **Spain 30.58 · Draw 48.92 · Argentina 20.50.**
When the books are too thin to be honest, the market stays **unpriced**. We never print a fabricated
33/33/33.

### Honest status

This is a **working prototype**, not a finished product. Settlement is deliberately switched off (see
Architecture → *The forge*). Some surfaces run a recorded replay tape rather than an in-play feed, and where
they do, the interface says so. Nothing on screen is invented data.

---

# PAGE 2 · ARCHITECTURE

## How Ninety is built

Ninety is a TypeScript monorepo with a Python quant worker and a Rust/Anchor program. Every significant
decision is recorded — 87 architecture decision records in `docs/adr/`, written before the code.

### The live path

```
TxLINE  ──SSE──▶  ingest worker  ──▶  Redis Streams bus  ──▶  engine  ──▶  API  ──▶  web
                                            │                   ▲
                                            └──▶  cortex  ──────┘
                                                (Python quant)
```

### The parts

**Fastify API** — 30 endpoints, fully typed and schema'd, with live Swagger. Auth, markets, quotes, orders,
portfolio, moments, leaderboard, search, events, and a cost-aware rich-data proxy.

**Single-writer LMSR engine** — the market maker. Exactly one writer owns market state, enforced by a lease
at boot, using journal-then-ack: the intent is journaled before it is acknowledged, so a crash cannot lose
or double-apply a fill. One match is low-throughput; correctness matters far more than horizontal scale, so
a single writer is the right trade.

**Redis Streams bus** — two planes: domain events and `sys.*` signals. **No service ever calls another
directly.** The ingest worker can die without taking prices down. This is the decision that makes every
other component replaceable.

**cortex (Python)** — the quant worker. De-vigging, the Poisson and Skellam inversions, and the Dixon-Coles
grid. Python because scipy is worth the polyglot cost.

**ingest / jobs workers** — live TxLINE consumption; the settlement saga, the AI Booth, and the EarlyWhistle
Telegram bot.

**Anchor program (Solana)** — verifies TxLINE's signed statistics on-chain before a market can settle.

**Storage** — Postgres via Prisma (Aiven), Valkey for cache and streams (Aiven).

### The two-source law

TxLINE owns everything that **moves** during a match — scores, goals, halts, prices, results.
Baked static data owns only what **sits still** — flags, crests, stadiums, the 104-fixture skeleton.
The tie-breaker is simple: if it changes during a match, TxLINE is the source of truth.

This exists because the free data tiers are rate-limited (10 requests/minute and 100/day), which makes
per-request upstream calls impossible. So static data is fetched once at build time and committed.

### On-chain, and the forge

Access to the feed is gated by a real Solana transaction — a guest token, an on-chain subscribe, then
activation. The chain is the gate, not a logo. Results are verified by the program, and **there is no admin
result path, by design.**

Building the settlement path, we adversarially reviewed it and found that **TxLINE's proof does not bind
match finality on-chain**. A permissionless caller could settle a wrong result using a genuine mid-match
proof by selecting the batch. So settlement is **fail-closed on purpose**:

```rust
pub const SETTLEMENT_LIVE: bool = false;   // compile-time, first statement of the settle handler
```

It is a compile-time constant, not a config flag — flipping it requires a source change, a rebuild and a
redeploy. We filed the finding back to TxODDS. We will not ship a settlement we can prove is forgeable,
even in play-money.

### Design system

Every colour is a design token; a raw hex in a component fails the build. Numbers are SF Mono with
tabular figures and one decimal; everything else is the system font — that single split is most of why the
interface reads like an exchange rather than a dashboard. Motion is 150–250ms ease-out, and
`prefers-reduced-motion` is honoured everywhere.

### Verified, not asserted

279 automated tests. A screen is not considered done until it has been screenshotted, looked at, and passed
the **read-out-loud test** — enumerate every text element and confirm no two contradict each other. That
test has caught more real bugs than every automated tool in the stack.

---

# PAGE 3 · FUTURE PLANS

## This is a prototype. I intend to run it for years.

Ninety was built in thirteen days for a hackathon. What exists today is a working prototype — a real
distributed system with a real data feed and a real on-chain component, but a prototype nonetheless.

I am not building this to win a prize and move on. This is a long-term project, and the World Cup is a
starting point rather than the destination. There is a football match somewhere every single day, and the
loop Ninety is built on works for all of them.

### Where the money goes

Everything currently runs on free tiers — Vercel, Aiven, Fly, Solana devnet. That was a deliberate
constraint and it produced a better architecture, but it is also the ceiling. The first investments:

**Infrastructure.** Proper compute — dedicated EC2 instances sized for the engine and the quant worker,
rather than shared 512MB machines. Managed Postgres with real connection pooling instead of a 20-connection
free tier. A production Redis. Proper observability.

**TxLINE credits.** The free World Cup tier is generous, but paid TxLINE access unlocks more competitions,
deeper markets, and higher rate limits. That is the single highest-leverage purchase — it turns one
tournament into every league.

**Sportmonks subscription.** For the general football data the current free tiers ration — squads, deep
player statistics, historical results, and the wider competition coverage that makes a consumer experience
feel complete rather than tournament-shaped.

### The product roadmap

**Mobile.** A native application is the obvious next surface. Football is watched with a phone in hand, and
a scroll-and-tap experience built for that context will always beat a responsive website.

**A more seamless interface.** The current UI is dense and functional. The next pass is about flow —
fewer decisions, faster paths, better transitions, and an experience that feels effortless rather than
merely complete.

**Deeper data.** Lineups, expected goals, head-to-head history, heatmaps, and per-player market impact
across every competition.

**The AI Pundit Bot.** EarlyWhistle with text-to-speech, so the match can talk to you while you are doing
something else.

**Social and creator layers.** Shareable Moments, rivalries, group leagues, and a public record of who
actually predicts football best.

### Why this compounds

The interesting long-term asset is not the interface — it is the data. A play-money exchange produces a
record of how people actually price football when they have no financial incentive to distort it. No
bookmaker can farm that, because nobody plays honestly when their own money is at risk.

That record is what makes everything else possible: a better prediction engine, a genuinely useful
consumer product, and a clean, legal top-of-funnel that a sportsbook could never build for itself.

---

# PAGE 4 · ABOUT

## Who built this

I am a **backend and blockchain engineer**. I have built more than twenty applications, and I currently
work as a backend and infrastructure engineer at a startup serving roughly **half a million active users**.
My depth is in distributed systems, scalable architecture, and the parts of a product that are invisible
when they work.

That is what Ninety is really made of. The single-writer engine with journal-then-ack, the two-plane event
bus, the polyglot quant worker, the on-chain verification path, the two-source data law, the 87 decision
records — that is the part I know how to do well, and it is why the system holds together on free-tier
infrastructure.

**The interface is not my home ground.** I am a backend engineer, and the frontend was built fast, with heavy
AI assistance, against a strict design system that kept it coherent. I would rather say that plainly than
pretend otherwise. What it demonstrates is that a backend engineer with a rigorous design system and modern
tooling can ship a consumer-grade surface — and that the architecture underneath it is the real work.

### The honesty thread

Two decisions in this project matter more to me than any feature:

**We fail-closed on settlement.** We found the sponsor's proof could not bind match finality on-chain, proved
it forgeable, and switched settlement off rather than ship it. It cost us a headline feature.

**We never fabricate data.** Where the interface shows a replay rather than a live feed, it says so. Where a
market cannot be priced honestly, it stays unpriced instead of printing a plausible-looking number.

Both come from the same instinct, and it is the instinct I would want judged.

### Links

- **Repository:** https://github.com/Sushant6095/ninety
- **Live app:** https://ninety-nu.vercel.app
- **Live API + Swagger:** https://omnipitch.fly.dev/docs
- **Solana program (devnet):** `6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj`
