// MAINNET TxLINE subscribe + activate — THE HUMAN RUNS THIS (ADR-059). It spends a small amount of
// real SOL (tx fee + ATA rent) from YOUR wallet to buy the free-tier SL12 data subscription (the DATA
// is free; the on-chain subscribe costs gas). Automation never runs this.
//
//   TXLINE_MAINNET_KEYPAIR_PATH=~/keys/mainnet.json node scripts/txline-mainnet-subscribe.mjs
//
// Modes:
//   default        — if TXLINE_MAINNET_TX_SIG exists in .env: REACTIVATE only (free, no on-chain tx).
//                    otherwise: prompt → send the subscribe tx (SL12, 4 weeks) → activate.
//   --new-subscribe  force a fresh on-chain subscribe even if a txSig is saved.
//   --yes            skip the interactive confirmation (you still ran it yourself).
//
// Writes to .env (never committed; names only ever printed): TXLINE_MAINNET_TX_SIG,
// TXLINE_MAINNET_API_TOKEN, TXLINE_MAINNET_JWT. Then smoke-tests fixtures/snapshot and looks up Arg–Eng.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { createPrivateKey, sign as edSign } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";

// ── mainnet constants (ADR-059) — cross-checked against the vendored IDL below ──────────────────
const API = "https://txline.txodds.com";
const RPC = process.env.TXLINE_MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA";
const MINT = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATA_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SUBSCRIBE_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
const LEVEL = 12; // SL12 — real-time, MAINNET ONLY (devnet rejects it: InvalidServiceLevelId)
const WEEKS = 4;
const LEAGUES = [];

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENV_PATH = ROOT + ".env";

// Same-network guard (docs law): the vendored mainnet IDL must declare exactly this program.
const idl = JSON.parse(readFileSync(ROOT + "packages/txline/txoracle.mainnet.json", "utf8"));
if (idl.address !== PROGRAM_ID) {
  console.error(`IDL/network mismatch: txoracle.mainnet.json declares ${idl.address}, expected ${PROGRAM_ID}. Refusing.`);
  process.exit(1);
}
const PROGRAM = new PublicKey(PROGRAM_ID);

const args = new Set(process.argv.slice(2));
const env = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
const envGet = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim() || process.env[k] || "";

const kpPath = envGet("TXLINE_MAINNET_KEYPAIR_PATH");
if (!kpPath) {
  console.error("Set TXLINE_MAINNET_KEYPAIR_PATH (in .env or the environment) to your FUNDED MAINNET wallet keypair JSON.");
  console.error("This wallet pays only the subscribe gas — the data is free. Never commit the keypair.");
  process.exit(1);
}
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(kpPath.replace(/^~/, process.env.HOME ?? "~"), "utf8"))));
const conn = new Connection(RPC, "confirmed");

const ata = (owner) => PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_2022.toBuffer(), MINT.toBuffer()], ATA_PROG)[0];
const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
const [pricingPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
const edB64 = (msg, sk) =>
  edSign(null, Buffer.from(msg), createPrivateKey({
    key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(sk.slice(0, 32))]),
    format: "der",
    type: "pkcs8",
  })).toString("base64");

const mask = (s) => (s.length <= 10 ? "***" : `${s.slice(0, 4)}…${s.slice(-4)} (${s.length} chars)`);

function persistEnv(pairs) {
  let out = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  for (const [k, v] of Object.entries(pairs)) {
    const line = `${k}=${v}`;
    out = out.match(new RegExp(`^${k}=`, "m")) ? out.replace(new RegExp(`^${k}=.*$`, "m"), line) : out.replace(/\n?$/, "\n") + line + "\n";
  }
  writeFileSync(ENV_PATH, out);
}

async function subscribeOnChain() {
  const bal = await conn.getBalance(kp.publicKey);
  console.log(`wallet ${kp.publicKey.toBase58()} | balance ${(bal / 1e9).toFixed(4)} SOL | rpc ${RPC}`);
  if (bal < 0.005 * 1e9) {
    console.error("Balance under 0.005 SOL — fund the wallet first (fee + possible ATA rent ≈ 0.003 SOL).");
    process.exit(1);
  }
  console.log(`About to send MAINNET tx: createATA(idempotent) + txoracle.subscribe(SL${LEVEL}, ${WEEKS}w) to ${PROGRAM_ID}.`);
  if (!args.has("--yes")) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question("This spends real SOL from YOUR wallet. Type 'yes' to continue: ");
    rl.close();
    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Aborted — nothing sent.");
      process.exit(0);
    }
  }
  const userAta = ata(kp.publicKey);
  const createAta = new TransactionInstruction({
    programId: ATA_PROG,
    keys: [
      { pubkey: kp.publicKey, isSigner: true, isWritable: true },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: kp.publicKey, isSigner: false, isWritable: false },
      { pubkey: MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]), // createIdempotent
  });
  const argsBuf = Buffer.alloc(3);
  argsBuf.writeUInt16LE(LEVEL, 0);
  argsBuf.writeUInt8(WEEKS, 2);
  const sub = new TransactionInstruction({
    programId: PROGRAM,
    keys: [
      { pubkey: kp.publicKey, isSigner: true, isWritable: true },
      { pubkey: pricingPda, isSigner: false, isWritable: false },
      { pubkey: MINT, isSigner: false, isWritable: false },
      { pubkey: userAta, isSigner: false, isWritable: true },
      { pubkey: ata(treasuryPda), isSigner: false, isWritable: true },
      { pubkey: treasuryPda, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ATA_PROG, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([SUBSCRIBE_DISC, argsBuf]),
  });
  const tx = new Transaction().add(createAta).add(sub);
  tx.feePayer = kp.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(kp);
  const txSig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction(txSig, "confirmed");
  console.log("SUBSCRIBE tx:", txSig);
  return txSig;
}

async function activate(txSig) {
  const gs = await fetch(`${API}/auth/guest/start`, { method: "POST" });
  const gsBody = await gs.json();
  const jwt = gsBody.token ?? gsBody.jwt ?? gsBody.access_token;
  if (!jwt) throw new Error(`guest/start returned no token (${gs.status})`);
  const message = `${txSig}:${LEAGUES.join(",")}:${jwt}`; // leagues=[] → "txSig::jwt"
  const res = await fetch(`${API}/api/token/activate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ txSig, walletSignature: edB64(message, kp.secretKey), leagues: LEAGUES }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`token/activate failed: ${res.status} ${text.slice(0, 200)}`);
  let apiToken;
  try {
    const j = JSON.parse(text);
    apiToken = typeof j === "string" ? j : (j.token ?? j.apiToken ?? j.api_token);
  } catch {
    apiToken = text.trim(); // bare-string token (ADR-015)
  }
  if (!apiToken) throw new Error("token/activate returned no apiToken");
  return { jwt, apiToken };
}

async function main() {
  const savedSig = envGet("TXLINE_MAINNET_TX_SIG");
  const txSig = !args.has("--new-subscribe") && savedSig ? savedSig : await subscribeOnChain();
  if (savedSig && txSig === savedSig) console.log("REACTIVATE mode — reusing saved subscribe tx (no SOL spent):", txSig);

  const { jwt, apiToken } = await activate(txSig);
  persistEnv({ TXLINE_MAINNET_TX_SIG: txSig, TXLINE_MAINNET_API_TOKEN: apiToken, TXLINE_MAINNET_JWT: jwt });
  console.log("activate OK → .env updated | apiToken", mask(apiToken), "| jwt", mask(jwt));

  // ── smoke: real mainnet data with the real headers ────────────────────────────────────────────
  const H = { authorization: `Bearer ${jwt}`, "x-api-token": apiToken };
  const fixtures = await (await fetch(`${API}/api/fixtures/snapshot`, { headers: H })).json();
  const arr = Array.isArray(fixtures) ? fixtures : [];
  console.log(`fixtures/snapshot → ${arr.length} fixtures`);
  const argEng = arr.find(
    (f) => /argentina/i.test(`${f.Participant1} ${f.Participant2}`) && /england/i.test(`${f.Participant1} ${f.Participant2}`),
  );
  if (argEng) {
    console.log(`ARG–ENG fixture: ${argEng.FixtureId} (${argEng.Participant1} v ${argEng.Participant2}) | GameState=${JSON.stringify(argEng.GameState)} | start ${new Date(argEng.StartTime).toISOString()}`);
    persistEnv({ TXLINE_LIVE_FIXTURE_ID: String(argEng.FixtureId) });
    const scores = await (await fetch(`${API}/api/scores/snapshot/${argEng.FixtureId}`, { headers: H })).json();
    console.log("scores/snapshot sample:", JSON.stringify(Array.isArray(scores) ? scores[0] : scores).slice(0, 600));
  } else {
    console.log("Arg–Eng not found in snapshot — first 8 fixtures:");
    for (const f of arr.slice(0, 8)) console.log(`  ${f.FixtureId} ${f.Participant1} v ${f.Participant2} | ${f.Competition}`);
  }
  console.log("\n✓ Done. Next: TXLINE_NETWORK=mainnet pnpm --filter worker-ingest dev");
}

main().catch((e) => {
  console.error("MAINNET SUBSCRIBE FAILED:", e?.message || e);
  if (e?.logs) console.error(e.logs.join("\n"));
  process.exit(1);
});
