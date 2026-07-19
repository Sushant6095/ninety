# Prompt — COMMIT, PUSH, DEPLOY. Make everything live.

81 files uncommitted. Public repo. Git history is permanent. Work in this exact order.

---

```
Commit everything we have locally, push to the public repo, and deploy both surfaces so the live site
matches the code. Order matters — do not reorder.

═══════════════════════════════════════════════════════════
STEP 1 — PRE-FLIGHT (3 fixes before anything is staged)
═══════════════════════════════════════════════════════════
1a. .gitignore GAP: `.keys/txline-devnet.json` is ignored but the `.keys/` DIRECTORY is not. Any other key
    file dropped there would be committed. Add `.keys/` (and `*.pem`, `**/id.json`) to .gitignore now.
1b. JUNK at repo root — do not commit: `Video-495.mp4` (2.7MB, a stray download). Delete it or gitignore it.
1c. RELOCATE: `Ninety-hackathon.pptx` sits at repo root. Move it to `docs/demo/` so the root stays clean.

═══════════════════════════════════════════════════════════
STEP 2 — SECRET SCAN (independent of mine; do it yourself)
═══════════════════════════════════════════════════════════
Scan every file you are about to commit for: TxLINE jwt / apiToken, Telegram bot token (pattern
`bot<digits>:AA…`), Solana private keys / mnemonics, Aiven URIs (`AVNS_…`), FOOTBALL_DATA_TOKEN,
API_FOOTBALL_KEY, ANTHROPIC_API_KEY, any `.env` content pasted into a doc or ADR.
Check the DOCS too — ADRs and handoff notes are where credentials most often leak, because people paste
real values as examples. Every credential in a doc must be a placeholder.
If ANYTHING real is found: do not commit. Report it. A secret in a public repo's history is not fixable by
a later commit.

═══════════════════════════════════════════════════════════
STEP 3 — PROVE IT BUILDS BEFORE YOU COMMIT
═══════════════════════════════════════════════════════════
rm -rf .next && pnpm --filter web build     (production; no dev server touching that dir)
pnpm test                                    (report the real number; do not claim a count you did not see)
tsc clean.
A red build must never be pushed on the final day. If it fails, fix it before committing.

═══════════════════════════════════════════════════════════
STEP 4 — COMMIT + PUSH
═══════════════════════════════════════════════════════════
Stage everything that survived Steps 1–2. One commit is fine today; a clear message beats clever splitting:
  feat: live TxLINE devnet ingest, entity pages, search, Telegram bot, landing + terminal craft pass
  - TxLINE devnet activated (ADR-084); renew-JWT-only refresh, no keypair in production
  - /player/[id] + /team/[code] entity pages from baked WC26 data
  - ⌘K entity search over the baked index
  - EarlyWhistle Telegram: real providers + inbound commands (ADR-085)
  - landing scroll-scrub (ADR-078), Apple font + light/dark (ADR-077)
  - honesty pass: removed fabricated telemetry, avatars, trader counts
Push to main (or merge merge/live-integration → main first if that is the public default branch — CHECK
which branch the repo actually serves, because judges will land on the default).

═══════════════════════════════════════════════════════════
STEP 5 — DEPLOY BOTH SURFACES
═══════════════════════════════════════════════════════════
WEB → Vercel: deploy, and make sure NEXT_PUBLIC_API_URL points at https://omnipitch.fly.dev (not localhost —
the repo .env currently says localhost:4000; Vercel needs the real value in its own env settings).
API/WORKERS → Fly: `fly deploy -c infra/fly/fly.toml` from the repo root if anything under apps/api,
apps/worker-* or packages/ changed. Then `fly machine list` — all four process groups started.

═══════════════════════════════════════════════════════════
STEP 6 — VERIFY ON THE LIVE URLS (not localhost — this is the whole point)
═══════════════════════════════════════════════════════════
Fetch the DEPLOYED pages and assert, with evidence pasted into the report:
  □ https://ninety-nu.vercel.app/            → 200, landing renders
  □ .../terminal                              → 200; grep the HTML: NO `pravatar`, NO `3,412`,
                                                NO "Live data from TxLINE" if ingest is pre-match,
                                                NO stale hardcoded SLOT
  □ .../player/<real id> and .../team/<real code> → both 200 (the entity pages judges will click)
  □ https://omnipitch.fly.dev/health          → {"ok":true}
  □ https://omnipitch.fly.dev/markets         → the Final present with real H/D/A (or honestly empty)
  □ https://omnipitch.fly.dev/docs            → Swagger renders
  □ Public repo in a fresh browser (logged out) → default branch shows today's work
A deploy you did not verify on the public URL is not a deploy. Paste the actual responses.

═══════════════════════════════════════════════════════════
STEP 7 — README + submission links final check
═══════════════════════════════════════════════════════════
Re-run and fix if drifted:
  echo "$(git rev-list --count HEAD) commits, $(ls docs/adr/ADR-*.md | wc -l | tr -d ' ') ADRs"
Update README, docs/SUBMISSION.md and docs/SUBMISSION-FIELDS.md to the true numbers.
```

---

## What my scan already found (so you don't redo it)

**Clean:** no `.env`, keypair, `id.json` or `.pem` files among the 81. `.env`,
`.keys/txline-devnet.json` and `apps/web/.env.local` are all correctly ignored. The pattern matches that
came back — `pnpm-lock.yaml`, `skills-lock.json`, two PNG composites — are false positives (lockfile hashes
and image binary), not credentials.

**Three real fixes before staging:** the `.keys/` *directory* isn't ignored (only the one file inside it is),
`Video-495.mp4` is 2.7MB of stray download sitting at the repo root, and `Ninety-hackathon.pptx` should live
in `docs/demo/` rather than the root.

**One thing to check that bites people:** confirm which branch the repo serves as default. You've been
working on `merge/live-integration`. If the default is still `main` and you only push the feature branch, a
judge clones the repo and sees none of this.
