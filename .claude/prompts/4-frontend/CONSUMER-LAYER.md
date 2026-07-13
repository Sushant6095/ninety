# PROMPT — The Consumer Layer (Ninety, Consumer & Fan Experiences track)

Web/desktop only. Mobile is OUT OF SCOPE this run — target lg + xl, do not spend an iteration on sm/md.

## THE THESIS
Ninety is a **fan product with a terminal inside it**, not a terminal with football data pasted on.
The terminal half is DONE and it is good: dense board, mono prices, live sparks, the River, LMSR.
The fan half does not exist. That is the whole gap. We are not swapping component libraries —
shadcn is unstyled primitives and 21st.dev is marketing patterns; neither renders a football match.
Re-skinned to our tokens they would produce a pixel-identical MatchCard. The gap is REGISTER, not
component provenance.

---

## PART 0 — WHY NOTHING HAS IMPROVED IN 5 DAYS (fix this first, or the rest reverts)

The ui-craft loop cannot improve the UI by construction:
- `.claude/agents/design-cop.md` criterion **9. FIDELITY** fails any structural deviation from
  `design/screens/home.png`. Every improvement is scored as "drift" and reverted. The reference is
  a CEILING, not a floor.
- ADR-043 froze that reference and ADRs are immutable-by-policy.
- CLAUDE.md says "more libraries = MORE slop", and any imported component trips design-cop #2
  (tokens-only) and #9 (fidelity) on arrival — so the agent rationally never reaches for one.

Fix the system, then the screens:

1. Write **ADR-047** superseding ADR-043: the reference is INTENT, not a pixel target. Structure may
   improve. What stays absolutely fixed: the tokens, the play-money copy law (never bet/stake/odds/
   wager), the architecture law, and River-as-hero. Do NOT edit ADR-043 — supersede it.
2. Rewrite design-cop criterion 9. Keep 1–8 verbatim (they are good law and are not the problem).
   Replace 9 with:
   - **9. CONSISTENCY** — every page uses ONE shell: same header, same nav, same spacing scale, same
     card treatment. Divergence between pages → FAIL, name both files.
   - **10. ELEVATION** — does this screen beat the reference or merely match it? Merely matching →
     NEEDS-WORK with a specific proposal. Matching is not passing.
   - **11. FEELING** — would a football fan who does not trade want to look at this? Name the one
     thing on the screen that creates delight. If there isn't one → FAIL.
3. Amend ui-craft SKILL.md: 3rd-party primitives are the DEFAULT for generic UI (dialog, tabs,
   tooltip, sheet, command, scroll-area). Hand-building those is a defect. Rule: PULL IT IN, THEN
   RE-SKIN TO TOKENS. The token law applies to the OUTPUT, not the moment of import. Ninety-specific
   pieces (River, MatchCard, PriceChip, trade ticket, ProofBadge, Booth) stay hand-built — no library
   has them.

---

## PART 1 — ONE SHELL, THEN DELETE THE OTHER

TWO SHELLS EXIST TODAY and this is the biggest reason the app feels broken:
- Home/Terminal: `Ninety [TERMINAL]` · search · CR · RANK · 11-item nav + a sub-nav row
- Moments: `Ninety [WC26]` · App|Terminal toggle · 6-item nav · no sub-nav

Pick the board/Terminal shell. Extract it to a single `<AppShell>`. Every route uses it. Delete the
other shell and every component only it used.

---

## PART 2 — DEAD CODE SWEEP

Build a real import graph of `apps/web/src` (do not guess). Delete — do not comment out:
- files/components imported by nothing
- the losing shell and its orphans
- unused exports, dead props, commented-out blocks
- **recharts** — a BANNED second chart library, imported by `features/terminal/PortfolioCard.tsx` and
  `features/terminal/AttackMomentum.tsx`. Replace with lightweight-charts or inline SVG (ADR-045
  precedent), then remove the dep from package.json.
- arbitrary-value debt: `text-[13px]` / `w-[260px]` / `min-w-[44px]` → named token-scale classes

`pnpm --filter web build` green after every batch. Report a table: file | why dead | deleted.

---

## PART 3 — THE CONSUMER LAYER (the actual work, in priority order)

### 3.1 Football identity — the fastest, biggest win
Teams are currently 20px flag circles. A fan's eye has nothing to land on.
- **flagcdn** (free, HD, no key): real high-res national flags everywhere a team appears.
- **Crests + player photos**: API-Football free tier is 100 req/day — CACHING IS MANDATORY. Fetch once,
  commit to `public/`, serve statically. Do not call it at runtime.
- Featured panel + Terminal header: big crests, team colors, proper kit-color accents on the price cells.
- Fall back gracefully — a missing crest must never break a row.

### 3.2 THE HALT IS THE MONEY SHOT — make it visible
We built the most dramatic mechanic in this whole hackathon — goal → market halts → reprices →
decaying spread — and it currently renders as a number quietly changing. Unacceptable for a fan product.
- Goal fires → the River flashes, an amber HALT overlay sweeps the chart, prices freeze visibly with a
  "MARKET HALTED · repricing" band, then the new price lands with a hard tick-flash and the spread
  visibly decays over 60s.
- This is a Framer Motion sequence (the ONLY animation lib — no anime.js, no confetti lib).
  150–250ms ease-out, transform/opacity only, `prefers-reduced-motion` honored.
- Amber `--halt` is for halts ONLY (design law). This is exactly its moment.
- Record this. It is the single best 8 seconds of the demo video.

### 3.3 Surface the Booth
The AI commentary is our most consumer-native feature (`worker-jobs/src/booth.ts`, ADR-038/039 — built,
tested, live). Today it's one grey line at the bottom of the Terminal.
- Promote it: a live "THE BOOTH" ticker/bubble that lands with motion when a swing fires, quoting the
  real move ("Ashour's counter — Egypt 31 → 55").
- On Home: a Booth line on the Featured panel.
- Voice law applies: booth-filter.ts vocabulary, never bet/stake/odds/wager.

### 3.4 Depth in tabs — the release valve
Our own law says football depth lives in tabs, never on the primary surface. The tabs are empty.
On the Terminal, behind the trade: **Lineups** (pitch formation view, player photos), **Stats** (bar
comparisons), **H2H**, **Events** (timeline). Use shadcn Tabs + ScrollArea for the chrome — re-skinned.
Data: TxLINE first (check payload depth before adding a source), then API-Football, cached.

### 3.5 /moments — kill the flat grid
Currently a uniform card grid with no hero — the exact anti-reference named in CLAUDE.md. Give it a hero
Moment of the Day (big, animated River replay of the swing) with the rest demoted to a quiet secondary rail.
Same check on /bracket, /history, /profile, /portfolio.

### 3.6 Polish that reads as "premium consumer"
- Skeletons on every async surface (not spinners).
- Empty states with personality, never a blank box.
- Every interactive element: hover / focus-visible / active / disabled.
- Sonner toasts for fills and settlements (already a dep).
- Command palette (⌘K) — shadcn `cmdk` is already installed and the search bar advertises ⌘K but it may
  not work. Make it work.

---

## PART 4 — THE LOOP (per screen)
Build → `node scripts/ui/screenshot.mjs <route> <name>` at lg+xl → **VIEW the shots** → run **design-cop**
against criteria 1–8 + CONSISTENCY + ELEVATION + FEELING → fix each numbered gap → repeat until PASS or
6 iterations, then escalate. Never call a screen done off "looks fine."

## RULES
Tokens only in the output — zero raw hex, zero stock zinc. Play-money vocabulary always. No gradients,
no glassmorphism, no light mode. Real WC26 data, never lorem. The River stays the hero and stays on
lightweight-charts. Framer Motion is the only animation lib. Don't touch `apps/api`, `packages/`, or
`programs/`.

End with /adr.
