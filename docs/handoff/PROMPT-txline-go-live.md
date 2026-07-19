# Prompt — GO LIVE ON TxLINE DEVNET (unblock B1). Real data, end to end.

The integration is already built and its constants are verified correct against the official TxODDS docs.
Nothing needs rewiring. What is missing is that **nobody has ever run the activation**. This prompt runs it.

---

```
Activate TxLINE on DEVNET and bring live data through the whole stack. World Cup data is a FREE tier — no
TxL purchase, no USDT, no KYC. You need only devnet SOL for transaction fees (free airdrop).

═══════════════════════════════════════════════════════════
STEP 0 — VERIFIED, DO NOT "FIX"
═══════════════════════════════════════════════════════════
packages/txline/src/network.ts already matches the official docs exactly:
  devnet  program 6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J · mint 4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG
  mainnet program 9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA · mint Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL
PDA seeds ("pricing_matrix", "token_treasury_v2") and deriveSubscribeAccounts() also match. Do not change
these. If something fails, the cause is credentials or network mixing, NOT the constants.

NETWORK LAW — one network for every step, no exceptions:
  DEVNET → rpc https://api.devnet.solana.com · host https://txline-dev.txodds.com · devnet program+mint.
  Never activate a devnet tx against txline.txodds.com, or a mainnet tx against txline-dev.txodds.com.
  The guest JWT must come from the SAME host used for activation.

═══════════════════════════════════════════════════════════
STEP 1 — WALLET + DEVNET SOL
═══════════════════════════════════════════════════════════
Use (or create) a devnet keypair. Airdrop devnet SOL for fees:
  solana-keygen new -o .keys/txline-devnet.json      # gitignored — NEVER commit
  solana airdrop 2 -k .keys/txline-devnet.json --url https://api.devnet.solana.com
Confirm .keys/ is in .gitignore and .dockerignore (it already is — verify, don't assume).

═══════════════════════════════════════════════════════════
STEP 2 — SUBSCRIBE ON-CHAIN (free WC tier) + ACTIVATE
═══════════════════════════════════════════════════════════
Use the existing script (scripts/txline-devnet-*.mjs) if it already does this; otherwise follow the docs:
  a. POST https://txline-dev.txodds.com/auth/guest/start  → guest JWT
  b. program.methods.subscribe(SERVICE_LEVEL_ID, DURATION_WEEKS) with the derived accounts → txSig
     (free World Cup tier: SELECTED_LEAGUES = [], no TxL transfer)
  c. Sign the EXACT message string. For the free bundle leagues is empty, so it is TWO colons:
       `${txSig}::${jwt}`
     Detached ed25519 signature, base64-encoded. Signer MUST be the same wallet that sent the subscribe tx.
  d. POST https://txline-dev.txodds.com/api/token/activate  { txSig, walletSignature, leagues: [] }
     with header Authorization: Bearer ${jwt}  → returns apiToken
If activation 403s, check in this order: the message string (two colons), the signature encoding (base64,
detached), the signing wallet identity, the tx network, the activation host. Do not guess — the docs list
exactly these five.

Print and save (to a gitignored file, NOT the repo): txSig, jwt, apiToken.

═══════════════════════════════════════════════════════════
STEP 3 — PROVE THE FEED IS REAL BEFORE TOUCHING THE APP
═══════════════════════════════════════════════════════════
Call the data API directly with BOTH headers:
  Authorization: Bearer ${jwt}   and   X-Api-Token: ${apiToken}
Fetch fixtures and confirm the REAL remaining World Cup matches are present — we expect
France v England (18257865) and Spain v Argentina (18257739), i.e. the third-place match and the FINAL.
Then pull odds + scores for one of them and paste the raw payload into the report. If the payload is empty
or the fixtures are absent, STOP and report — everything downstream depends on this being real.

═══════════════════════════════════════════════════════════
STEP 4 — JWT LIFECYCLE (check this; it may simplify the deploy a lot)
═══════════════════════════════════════════════════════════
Per the docs: on a 401, you renew the guest JWT with a plain POST /auth/guest/start and retry with the SAME
apiToken. That renewal needs NO wallet signature. So if our worker's refresh path only renews the JWT (and
does not re-activate), the wallet keypair is NOT required on the Fly machine at all — the lazy signer from
ADR-079 is then sufficient on its own.
→ Read apps/worker-ingest/src/liveAuth.ts and confirm which it does. Report the answer explicitly. If it
  re-activates on refresh, change it to renew-JWT-only, so production never needs the private key.

═══════════════════════════════════════════════════════════
STEP 5 — DEPLOY
═══════════════════════════════════════════════════════════
  fly secrets set TXLINE_NETWORK=devnet TXLINE_DEVNET_JWT=<jwt> TXLINE_DEVNET_API_TOKEN=<apiToken> -a omnipitch
  (Only if Step 4 proves the key is needed: also ship the keypair via a secret written to a file at boot and
   set TXLINE_DEVNET_KEYPAIR_PATH. Prefer NOT to — a private key on a demo host is avoidable risk.)
REDEPLOY — mandatory. The running image still carries the EAGER signer; the lazy fix (ADR-079) is on disk
only. Without a redeploy, ingest crashes on the keypair again the moment the live block runs.
Then: fly machine list (all four started), fly logs (ingest boots, authenticates, begins consuming).

═══════════════════════════════════════════════════════════
STEP 6 — VERIFY END TO END, THEN FLIP THE LABELS
═══════════════════════════════════════════════════════════
  - GET https://omnipitch.fly.dev/markets must STOP returning [] and carry the real fixtures.
  - Confirm cortex prices them (1X2 synthesis from the O/U + Asian-handicap books) — real H/D/A, never 33/33/33.
  - Watch a price move on the terminal against the live feed.
ONLY AFTER real data is flowing: flip the REPLAY/PREVIEW labels back to LIVE, restore the footer to
"Live data from TxLINE", and update the PROTOTYPE banner. Order matters — labels follow data, never lead it.
If the Final has not kicked off, the honest state is "live feed connected, market pre-match" — which is
still a genuine live integration, and say exactly that.

Update docs/BLOCKERS.md (close B1), write an ADR recording the activation, and NEVER commit jwt/apiToken/
keypair. Secret-scan before any commit.
```

---

## Why this is now worth doing (note for Sushant)

Three things changed with these docs:

1. **World Cup data is a free tier.** No TxL purchase, no USDT, no KYC. The only cost is devnet SOL, which
   is a free airdrop. The paywall I assumed was blocking you does not exist for your use case.
2. **Your constants are already correct** — I verified all four program IDs and mints, plus the PDA seeds,
   against the official table. The integration was built right and never switched on.
3. **The devnet feed carries the actual remaining fixtures** — France v England and Spain v Argentina are
   the third-place match and the Final. So "live TxLINE data for the World Cup Final" is genuinely available
   to you, which is a far better demo than a replay.

One correction to something I told you earlier: I said a token refresh would re-sign via the wallet and
therefore need the keypair on the Fly machine. **The docs say otherwise** — a 401 is fixed by renewing the
guest JWT with a plain POST, reusing the same apiToken, no signature. Step 4 makes the terminal confirm what
our code actually does. If it only renews, you never need to put a private key on a demo host at all.
