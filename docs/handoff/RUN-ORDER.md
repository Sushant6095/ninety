# RUN ORDER — final day. What runs in parallel, what must not, when to push.

Deadline **2026-07-19 23:59 UTC**. Rule for today: **push after every session lands, never batch.**
One broken session must not block eight good ones from reaching the public repo.

---

## Already done — do not re-run
- ✅ TxLINE devnet activated + live ingest (ADR-084)
- ✅ Player pages `/player/[id]` + team pages `/team/[code]`
- ✅ EarlyWhistle Telegram: providers wired + inbound commands (ADR-085)
- ✅ Landing scroll-scrub pass 1 (ADR-078)
- ✅ Ralph pass 1–3 (the CSS-desync root cause)

## Outstanding — every prompt already written and waiting

| # | Prompt | Owns | Blocks? |
|---|---|---|---|
| A | `PROMPT-real-data-honesty-pass.md` | banner, labels, pravatar, fake telemetry | **DISQUALIFICATION RISK — do first** |
| B | `PROMPT-wire-entity-links.md` | CommandMenu gate, terminal links | none |
| C | `PROMPT-live-ticker.md` | `richdata.ts`, `Ticker.tsx` | football-data key |
| D | `PROMPT-search-entities.md` + spotlight amendment | `search.ts`, `CommandMenu.tsx` | football-data key |
| E | `PROMPT-docs-site.md` | `/docs` routes (all new) | none |
| F | `PROMPT-landing-finale-parallax.md` | new finale component | none |
| G | `PROMPT-component-replacement-map.md` | `components/ui/*` swaps | touches many files |
| H | `PROMPT-component-integration-wave1.md` | new components | needs `lib/anime.ts` first |
| I | `PROMPT-TERMINAL-9OF10-FINAL.md` | terminal identity + edge cases | none |
| J | `PROMPT-LANDING-9OF10-LOOP.md` | landing craft loop | long-running |

---

## The three collision rules (these are the only things that can't run together)

**1. The football-data key is 10 req/min, shared.** C and D both hit it. Serialise their *bakes* only —
D bakes first and announces `BAKE DONE`, then C probes. Everything else in both can proceed in parallel.

**2. `components/ui/*` is a shared surface.** G (replacements) rewrites files that B, I and H also touch.
Run **G alone**, land it, push it — then the others. Trying to swap primitives while three sessions edit
consumers is how you lose an afternoon to merge conflicts.

**3. One verification server.** `:3000` can host one `next start`. Sessions may build in parallel but only
one verifies at a time — or better, verify once after each merge.

Everything else is genuinely independent: E (new routes), F (new component), I (terminal), J (landing craft).

---

## Suggested wave plan

**WAVE 1 — now, in parallel** → then push
- A (honesty pass) ← **highest priority, it's the disqualification risk**
- B (entity links)
- E (docs site)

**WAVE 2 — after wave 1 pushes** → then push
- G (component replacements) **alone**, since it rewrites shared primitives

**WAVE 3 — in parallel** → then push
- C + D (ticker + search; D bakes first)
- F (landing finale)
- H (component wave 1 — after `lib/anime.ts` + law-guard exist)

**WAVE 4 — whatever time remains**
- I (terminal 9/10), J (landing loop). These are quality loops with no fixed end; run them until the clock
  forces a stop, pushing after each pass.

---

## Push discipline

After **every** wave:
```
secret-scan → rm -rf .next && pnpm --filter web build → pnpm test → commit → push → deploy → verify LIVE url
```
Never push a red build. Never batch two waves into one push. Verify the deployed URL, not localhost —
a deploy you didn't fetch is not a deploy, and that has already bitten twice on this project.

## Stop line

**Whatever is unfinished at T-2 hours, abandon.** The video and the submission form outrank every prompt in
this document. A perfect terminal with no demo video scores zero — it's an absolute screening requirement,
and judges likely won't see the site live because the tournament ends before review.
