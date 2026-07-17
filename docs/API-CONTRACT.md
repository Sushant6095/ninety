# API-CONTRACT.md — fixture → endpoint wiring map

The frontend renders from baked fixtures (`apps/web/src/lib/*.ts`, `apps/web/src/data/wc26`). This maps each
fixture shape to the endpoint that serves it, so the swap (replace the fixture import with an `api()` call) is
mechanical. Base URL: `NEXT_PUBLIC_API_URL` (see `apps/web/src/lib/api.ts`); API listens on `:4000`.

**Convention (ADR-071):** the H/D/A outcome model is the product face; the live feed is over/under, synthesized to
1X2 in cortex (quant-reviewer-gated). A market with no COMPLETE {H,D,A} mark renders **unpriced** (`mark: null`,
`amm.q: null`, quote `409`, `markNow: null`) — never a fabricated 33/33/33 book.

**Two flagged issues (pre-existing, NOT resolved here — for the quant-reviewer):**
1. `/quote` cost + `/portfolio` `markNow`/`value` scale ×100 (`PAYOUT_PER_SHARE`), but the engine/ledger/`/orders`
   are engine-native (~0..1/share). Free vs held read on different scales. Decide "a share pays 1 or 100" and
   reconcile once. `POST /orders` reports authoritative engine-native numbers.
2. The engine fills against its own LMSR `q` (seeded `[0,0,0]`, moved only by fills), not the displayed mark —
   quote/fill parity is not yet real (ADR-042 "guarded engine-emit", the immediate follow-up).

---

## BOARD / HOME — `MarketRow` (`lib/fixtures.ts` `MARKETS`) → `GET /markets`

`{ markets: MarketView[] }`. Per-market (`http/routes/markets.ts` `marketView`):

| Frontend field | API field | Notes |
|---|---|---|
| `marketId`, `matchId`, `kind`, `status` | same | `status` is the 7-state union; matches exactly |
| `home`, `away` | same | FULL names ("Canada"); the API has no team code |
| `homeCode`/`awayCode`/`homeFlag`/`awayFlag` | — (client-derived) | map name→code+flag+crest from baked `data/wc26` (`teamByName`/`crestByCode`), ADR-051/055 |
| `competition` | — (client-derived) | WC26 constant; derive from `stage`/context |
| `minute` | `minute` | **added** — live clock (TxLINE `Match.minute`); `null` pre-match/settled |
| `score` `{home,away}` | `score` | **added** — parsed from `Match.score` "h-a"; `null` pre-match |
| `mark` `Record<outcome,number>` | `mark` | 0..1; `null` unless a COMPLETE H/D/A mark exists (ADR-071) |
| `spark` `number[]` | — (client-derived) | the live store builds the mini-river from mark ticks |
| `favourite` | — (client-derived) | `argmax(mark)` |
| `volume` | — (deferred) | per-market credits-traded counter not yet tracked; client hides/derives |
| — | `hazard`, `markTs`, `settledOutcome`, `settleSig` | extra (bonus) fields the fixture omits |

Ticker + terminal rail are derived from `MARKETS` client-side — no separate feed.

## TERMINAL detail — `TerminalMatch` (`lib/terminal.ts` `MATCH`) → `GET /markets/:matchId` (auth)

`{ market: MarketView, granted: boolean, amm: { q: number[]|null, b, spread_mult: 1, markImplied: true } }`.
`amm.q` is the mark-implied reconstruction (`null` if the mark is incomplete). `homeMeta`/`awayMeta`/`venue`/
`goalLabel` are client copy; `b`/`tick` come from `amm.b` / market config. Live overlay (`status/minute/score/
prices/spark`) rides the WS `m:{matchId}:*` channels, not this REST snapshot.

## TERMINAL quote — `lib/lmsr.ts quote()` → `GET /markets/:matchId/quote?outcome=&size=&side=` (auth)

`{ quote: { outcome, side, size, cost, avgPx, maxPayout, spreadMult, markImplied } }`. `409` when the market is
unpriced (incomplete mark), SETTLED, or VOIDED. Client keeps `lmsr.ts` for instant preview; server price wins at
fill. ⚠ cost is ×100-scaled (issue 1 above).

## LEADERBOARD — `LeaderRow` (`lib/fixtures.ts` `LEADERS`) → `GET /leaderboard?limit=`

`{ leaderboard: [{ rank, userId, pnl, handle }] }`. **`handle` added** (resolved from `User.handle`; frontend
renders the "@"). `pnl` is net credit P&L. Power rankings / group standings are still client fixtures
(`lib/rankings.ts`) — a future endpoint or baked wc26 standings.

## PORTFOLIO — `OpenPosition`/`Account` (`lib/portfolio.ts`) → `GET /portfolio` (auth)

`{ portfolio: { free, held, equity, positions: PortfolioPositionFull[] } }`. Fields **aligned to the frontend
contract**:

| Frontend | API | Notes |
|---|---|---|
| `shares` | `shares` | was `qty` |
| `avgEntry` | `avgEntry` | was `avgPrice`; 0..100 |
| `markNow` | `markNow` | was `markPct`; `null` if unpriced (ADR-071), never 0 |
| `matchId`, `outcome` | same | **matchId added** via Position→Market→Match join |
| `homeCode`/`awayCode`/`pick` | — (client-derived) | from `home`/`away` names + outcome, via baked wc26 |
| `minute`, `status` (`LIVE`/`PRE`) | same | **added** — from the joined match |
| — | `value`, `pnl`, `pnlPct` | server-computed bonus (client also computes) |

`FILLS` (`lib/portfolio.ts`) → **`GET /orders`** (below). `Account.curve` (equity time-series) is not yet served
(deferred).

## ORDER HISTORY — `Fill` (`lib/portfolio.ts` `FILLS`) → `GET /orders?limit=` (auth) — NEW (ADR-071)

`{ orders: [{ id, ts, matchId, home, away, outcome, side, size, filled, status, avgPrice, credits, fee }] }`.
`avgPrice`/`credits`/`fee` are engine-native (issue 1). `homeCode`/`pick` derived client-side.

## PLACE TRADE — trade ticket → `POST /orders` (auth) — NEW (ADR-071)

Body `{ matchId, outcome: "H"|"D"|"A", side: "buy"|"sell", size: int, limit? }`.
- `200 { accepted, matchId, outcome, side, fill: { size, price, cost, fee } }` — fill (engine-native units).
- `4xx { error, code }` — typed engine reject: `400` INVALID_SIZE/OUTCOME · `409` MARKET_HALTED/SLIPPAGE/
  PRICE_UNAVAILABLE/not-tradeable · `429` RATE_LIMIT · `422` INSUFFICIENT_BALANCE/POSITION/POSITION_CAP.
- `401` unauth · `404` no market · `503` engine unavailable / backpressure · `202` `{accepted, status:"processing"}`
  if the lane is slow (order is journaled; read the result from `GET /orders` / `GET /portfolio`).
- Credits only — no balance/deposit/payout field, ever (play-money invariant).

## MOMENTS — `MOMENTS` (`lib/moments.ts`) → `GET /moments` + `/moments/:id` — BUILT (ADR-072)

`{ moments: MomentView[] }`, newest first, optional `?matchId=`, `?limit=` (≤100).
`MomentView = { id, createdAt, matchId, home, away, imageUri, swing:number|null, mintSig:string|null, minted:boolean }`.
`mintSig` is the RAW Solana sig (client builds the Solscan URL) and is `null` until minted — no fabricated proof
link. `home`/`away` are full names; the client derives code/crest from baked wc26. `Moment` gained `createdAt` +
`swing` in the ADR-072 migration (it was previously unordered).

`PROOFS` (`lib/proofs.ts`) → a proofs endpoint that adds a nullable `txSig` only when a real 87-char settle sig
exists (settlement is fail-closed; ADR-036/037). Still deferred.

## NEXT-GOAL GAME — `GET`/`POST /games/picks` (auth) — BUILT (ADR-072)

Free, one-tap PREDICTION — play-money, no stake, no payout. `POST` body `{ matchId, choice:"home"|"away"|"none",
kind?:"next_goal" }` → `201 { pick }`; `409 { error, pick }` if an OPEN pick already exists; `404`/`409` for a
missing/over match. `GET ?matchId=&limit=` → `{ picks: PickView[] }`.
`PickView = { id, matchId, kind, choice, status:"OPEN"|"WON"|"LOST"|"VOID", openMinute, createdAt, resolvedAt }`.
Resolution (OPEN→WON/LOST) is worker-side on the real TxLINE goal — never in the HTTP layer (two-source law).

## IN-PLAY TIMELINE — `GET /matches/:id/events` + `/actions` — BUILT (ADR-072)

Snapshot from the `events-read` Redis cache; the WS `m:{id}:events|actions` channels stream the live delta on top.
`{ matchId, events:[...] }` / `{ matchId, actions:[...] }`, newest first, `?limit=` (≤200). Each item mirrors the
WS frame `d`: an event is `{ type, ...payload, ts }` (goal/red/half/halt…); an action is `{ ...payload, ts }`
(shot/free_kick/var/substitution…). TxLINE-owned; Redis mirrors, never authors (ADR-051).

## SEARCH — `GET /search?q=&limit=` (public) — BUILT (ADR-072)

`{ q, teams:[{name}], matches:[{ id, home, away, stage, kickoffAt, status }] }`. `q` ≥ 2 chars else empty.
Matches by fixture home/away (case-insensitive); teams are the distinct names that contain the query. Client
derives code/crest/flag from baked wc26.

## RICH STILL DATA — `GET /rich/*` (public, env-gated) — BUILT (ADR-072)

Cost-aware cached proxy over two free providers, STILL data only (never live match state — two-source law).
Response `{ source, cached, data }`. Degrades honestly: `503 { error, needs:"<ENV_VAR>" }` if a source is unkeyed,
`429` if the per-source budget is spent, `502` on upstream error — never fabricated.

| Endpoint | Source | Cache | Gap-only? |
|---|---|---|---|
| `/rich/standings/:competition` | Football-Data.org (10/min) | 1h | — |
| `/rich/scorers/:competition` | Football-Data.org | 1h | — |
| `/rich/teams/:id` | Football-Data.org | 12h | — |
| `/rich/matches/:id/h2h` | Football-Data.org | 24h | — |
| `/rich/lineups/:fixture` | API-Football (100/DAY) | 6h | ✅ FD.org has none |
| `/rich/players/:id?season=` | API-Football | 6h | ✅ |
| `/rich/injuries/:fixture` | API-Football | 1h | ✅ |

Routing law: Football-Data.org first for anything it covers; spend the scarce API-Football budget ONLY on the gaps.
Provider-native ids (not TxLINE ids) — the TxLINE↔provider mapping is a separate concern.

## LIVE WS — `wsConnect(url, channels, onFrame)` (`lib/api.ts` re-exports `lib/ws.ts`)

`NEXT_PUBLIC_WS_URL` (`:4001`). Subscribe `{ op:"sub", ch:[...], since:{ch:seq} }`. Channels `m:{id}:prices`
`m:{id}:events` `m:{id}:actions` `m:{id}:booth` `lb:global`. Frame `{ ch, seq, t, d }`. Resume-capable.

## STATIC (never an endpoint) — `data/wc26/*`

Teams / groups / stadiums / 104-fixture skeleton / media (badges, players) stay baked (ADR-051, "sit still"). The
frontend uses these to derive codes/flags/crests/pick from the names + ids the API returns.
