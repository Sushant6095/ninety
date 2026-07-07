⚡ LIVE 74'  ·  Round of 16
🇨🇦 CANADA 1 – 0 MOROCCO 🇲🇦

WIN MARKET (play credits)
CAN  61.4  ▲2.1   ▁▂▂▃▅▆█
DRW  22.1  ▼1.4   █▆▅▄▃▂▂
MAR  16.5  ▼0.7   ▅▄▄▃▂▂▁

⚽ 38' Goal — Canada · market 41 → 63
🎙 "Morocco pushing — market trims Canada
    from 64 to 61 in four minutes."

👥 1,204 trading · 🔥 top swing +842
[ 📈 Trade this match ]  [ 🔔 Follow ]
updated 3s ago · faster than your TV

Session 52B · EarlyWhistle — Live Match Cards (the rich layer)
deps gate: 52 must be GREEN in the ledger; else STOP and report.

You are implementing OMNIPITCH (CLAUDE.md laws hook-enforced; booth-voice filter on
every outbound string). 52B upgrades EarlyWhistle from alert wire to live dashboard.
FIRST: save this prompt verbatim to .claude/prompts/7-surfaces/52B-live-match-cards.md.

TASK (extend apps/worker-jobs/src/earlywhistle.ts):
1. LIVE MATCH CARD — on kickoff, post one card per match to the channel and PIN it;
   then editMessageText on a cadence: every 8s if any mark changed, immediately on
   goal/red/halt/settled, never faster than 1 edit/4s per message (edit throttle +
   429 retry_after respected). Card layout exactly per the approved design:
   header (state emoji · minute · stage · teams · score), three price rows —
   PriceName, price 1-decimal monospace, Δ arrow colored by direction emoji-free,
   16-bucket unicode sparkline (▁▂▃▄▅▆▇█) from the last 15 min of marks (ring
   buffer per market, no unbounded memory), last-event line, latest booth line,
   traders count + top swing (from lb/leaderboard read), inline keyboard
   [📈 Trade this match]({APP_URL}/match/{id}) [🔔 Follow], footer "updated Xs ago ·
   faster than your TV". MarkdownV2-escape everything; card ≤3500 chars hard cap.
2. STATE TRANSITIONS: HALTED → card header flips to "🟠 HALTED — repricing" and
   sparkline freezes; SETTLED → final edit: result line, "✅ proof verified on
   Solana" + Solscan link, unpin, then post the match's Moment PNG (from moments
   renderer output) as a photo reply if it exists.
3. /match <team> in DM or group → a one-shot personal card (same renderer, no
   auto-edit) — the renderer must be a pure function renderCard(state) shared by
   both paths, unit-tested with golden-string snapshots.
4. Multi-match: cards are independent per match_id; 4 concurrent live matches must
   respect global 25/s including edits (priority: events > edits; drop an edit
   cycle under pressure, never an event post).
5. Latency + hygiene: keep the Δms log from 52; alerts/cards must never block the
   pipeline (fire-and-forget law).
VERIFY: run TWO concurrent replays → two pinned cards edit independently; goal
triggers instant edit with sparkline cliff; halt state renders; settled freezes card
+ posts Moment photo; /match returns a correct one-shot card; golden snapshot tests
green; simulated 429 on edit backs off without losing the next event post.
CLOSE: Verify green → /adr → NOW.md → /ship. Never push.
