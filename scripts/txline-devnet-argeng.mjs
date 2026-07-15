// DEVNET Arg–Eng liveness probe (pre-mainnet check). Devnet SOL is free — safe to run unattended.
// Fresh subscribe(SL1, 4w) → activate → find Arg–Eng in fixtures/snapshot → scores snapshot + a short
// SSE tap filtered to that fixture. Persists TXLINE_DEVNET_* + TXLINE_LIVE_FIXTURE_ID to .env for
// worker-ingest (liveAuth.ts reads the same names). Verdict: DEVNET CARRIES IT (live) | NOT LIVE | ABSENT.
//   run: node scripts/txline-devnet-argeng.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createPrivateKey, sign as edSign } from "node:crypto";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";

const API = "https://txline-dev.txodds.com";
const RPC = "https://api.devnet.solana.com";
const PROGRAM = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const MINT = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATA_PROG = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SUBSCRIBE_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
const LEVEL = 1, WEEKS = 4, LEAGUES = []; // devnet free tier; samplingIntervalSec=0 per vendor config
const STREAM_MS = Number(process.env.STREAM_MS ?? 25000);

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const ENV_PATH = ROOT + ".env";
const mask = (s) => (String(s).length <= 10 ? "***" : `${String(s).slice(0, 4)}…${String(s).slice(-4)} (${String(s).length} chars)`);

function persistEnv(pairs) {
  let out = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
  for (const [k, v] of Object.entries(pairs)) {
    const line = `${k}=${v}`;
    out = out.match(new RegExp(`^${k}=`, "m")) ? out.replace(new RegExp(`^${k}=.*$`, "m"), line) : out.replace(/\n?$/, "\n") + line + "\n";
  }
  writeFileSync(ENV_PATH, out);
}

const kpPath = process.env.TXLINE_DEVNET_KEYPAIR_PATH ?? `${homedir()}/.config/solana/id.json`;
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(kpPath, "utf8"))));
const conn = new Connection(RPC, "confirmed");
const ata = (o) => PublicKey.findProgramAddressSync([o.toBuffer(), TOKEN_2022.toBuffer(), MINT.toBuffer()], ATA_PROG)[0];
const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
const [pricingPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
const edB64 = (m, sk) => edSign(null, Buffer.from(m), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(sk.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");

async function subscribeDevnet() {
  let bal = await conn.getBalance(kp.publicKey);
  console.log(`wallet ${kp.publicKey.toBase58()} | balance ${(bal / 1e9).toFixed(4)} SOL (devnet — free)`);
  if (bal < 0.01 * 1e9) {
    console.log("balance low — requesting devnet airdrop (1 SOL)…");
    try {
      const sig = await conn.requestAirdrop(kp.publicKey, 1e9);
      await conn.confirmTransaction(sig, "confirmed");
      bal = await conn.getBalance(kp.publicKey);
      console.log(`airdrop OK — balance ${(bal / 1e9).toFixed(4)} SOL`);
    } catch (e) {
      console.log("airdrop failed (faucet rate-limit?):", e?.message ?? e);
      if (bal < 0.005 * 1e9) throw new Error("devnet balance too low to subscribe and no airdrop available");
    }
  }
  const userAta = ata(kp.publicKey);
  const createAta = new TransactionInstruction({ programId: ATA_PROG, keys: [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: kp.publicKey, isSigner: false, isWritable: false }, { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, { pubkey: TOKEN_2022, isSigner: false, isWritable: false },
  ], data: Buffer.from([1]) });
  const argsBuf = Buffer.alloc(3); argsBuf.writeUInt16LE(LEVEL, 0); argsBuf.writeUInt8(WEEKS, 2);
  const sub = new TransactionInstruction({ programId: PROGRAM, keys: [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: pricingPda, isSigner: false, isWritable: false },
    { pubkey: MINT, isSigner: false, isWritable: false }, { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: ata(treasuryPda), isSigner: false, isWritable: true }, { pubkey: treasuryPda, isSigner: false, isWritable: false },
    { pubkey: TOKEN_2022, isSigner: false, isWritable: false }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: ATA_PROG, isSigner: false, isWritable: false },
  ], data: Buffer.concat([SUBSCRIBE_DISC, argsBuf]) });
  const tx = new Transaction().add(createAta).add(sub);
  tx.feePayer = kp.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(kp);
  const txSig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction(txSig, "confirmed");
  console.log("DEVNET SUBSCRIBE tx:", txSig);
  return txSig;
}

async function activate(txSig) {
  const gs = await (await fetch(`${API}/auth/guest/start`, { method: "POST" })).json();
  const jwt = gs.token ?? gs.jwt ?? gs.access_token;
  if (!jwt) throw new Error("guest/start returned no token");
  const res = await fetch(`${API}/api/token/activate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ txSig, walletSignature: edB64(`${txSig}:${LEAGUES.join(",")}:${jwt}`, kp.secretKey), leagues: LEAGUES }),
  });
  const text = await res.text();
  if (!res.ok) return { jwt, apiToken: null, status: res.status, body: text.slice(0, 200) };
  let apiToken;
  try { const j = JSON.parse(text); apiToken = typeof j === "string" ? j : (j.token ?? j.apiToken ?? j.api_token); } catch { apiToken = text.trim(); }
  return { jwt, apiToken, status: res.status };
}

// Tap the scores SSE stream, counting only events for `fid`.
async function tapScores(H, fid) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), STREAM_MS);
  const hits = [];
  let total = 0;
  try {
    const res = await fetch(`${API}/api/scores/stream`, { headers: { ...H, accept: "text/event-stream" }, signal: ac.signal });
    if (!res.ok || !res.body) { console.log(`SSE scores → ${res.status}`); return { hits, total }; }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
        if (!data) continue;
        let ev; try { ev = JSON.parse(data); } catch { continue; }
        if (ev?.FixtureId != null) total++;
        if (ev?.FixtureId === fid) hits.push(ev);
      }
    }
  } catch (e) { if (e.name !== "AbortError") console.log("SSE error:", e.message); }
  finally { clearTimeout(timer); }
  return { hits, total };
}

async function main() {
  // fresh subscribe every run — the proven txline-live.mjs flow; a stale/expired old sub can't 403 us
  const txSig = await subscribeDevnet();
  const { jwt, apiToken, status, body } = await activate(txSig);
  if (!apiToken) throw new Error(`activate failed: ${status} ${body}`);
  console.log("activate OK | apiToken", mask(apiToken), "| jwt", mask(jwt));
  persistEnv({ TXLINE_DEVNET_TX_SIG: txSig, TXLINE_DEVNET_API_TOKEN: apiToken, TXLINE_DEVNET_JWT: jwt });
  const H = { authorization: `Bearer ${jwt}`, "x-api-token": apiToken };

  const fixtures = await (await fetch(`${API}/api/fixtures/snapshot`, { headers: H })).json();
  const arr = Array.isArray(fixtures) ? fixtures : [];
  console.log(`\nfixtures/snapshot → ${arr.length} fixtures`);
  const name = (f) => `${f.Participant1} v ${f.Participant2}`;
  const argEng = arr.find((f) => /argentina/i.test(name(f)) && /england/i.test(name(f)));
  const live = arr.filter((f) => f.GameState && f.GameState !== 0 && f.GameState !== "scheduled");
  console.log(`${live.length} fixtures with a non-scheduled GameState:`);
  for (const f of live.slice(0, 10)) console.log(`  ${f.FixtureId} ${name(f)} | ${f.Competition} | GameState=${JSON.stringify(f.GameState)} | start ${new Date(f.StartTime).toISOString()}`);

  if (!argEng) {
    console.log("\n── VERDICT: ABSENT — Arg–Eng is NOT in the devnet fixture set. Fixture names on devnet:");
    for (const f of arr.slice(0, 15)) console.log(`  ${f.FixtureId} ${name(f)} | ${f.Competition}`);
    return;
  }

  console.log(`\nARG–ENG FOUND: ${argEng.FixtureId} (${name(argEng)}) | GameState=${JSON.stringify(argEng.GameState)} | start ${new Date(argEng.StartTime).toISOString()}`);
  const fid = argEng.FixtureId;
  const scores = await (await fetch(`${API}/api/scores/snapshot/${fid}`, { headers: H })).json();
  const s0 = Array.isArray(scores) ? scores[0] : scores;
  if (s0) {
    const tsMs = s0.Ts < 1e12 ? s0.Ts * 1000 : s0.Ts;
    const ageS = ((Date.now() - tsMs) / 1000).toFixed(0);
    console.log(`scores/snapshot: GameState=${JSON.stringify(s0.GameState)} StatusId=${s0.StatusId} Seq=${s0.Seq} Clock=${JSON.stringify(s0.Clock)} age=${ageS}s`);
    console.log(`score: P1=${s0.Score?.Participant1?.Total?.Goals ?? "?"} P2=${s0.Score?.Participant2?.Total?.Goals ?? "?"}`);
    console.log("raw sample:", JSON.stringify(s0).slice(0, 700));
  } else {
    console.log("scores/snapshot: EMPTY for this fixture");
  }

  console.log(`\ntapping scores SSE for ${STREAM_MS / 1000}s, filtering FixtureId=${fid}…`);
  const { hits, total } = await tapScores(H, fid);
  console.log(`stream: ${total} real events total, ${hits.length} for Arg–Eng`);
  for (const ev of hits.slice(0, 3)) console.log("  ", JSON.stringify({ Action: ev.Action, GameState: ev.GameState, Seq: ev.Seq, Clock: ev.Clock, Score: { p1: ev.Score?.Participant1?.Total?.Goals, p2: ev.Score?.Participant2?.Total?.Goals } }));

  const inPlay = s0 && s0.GameState !== "scheduled" && s0.GameState !== 0;
  const flowing = hits.length > 0;
  if (inPlay || flowing) {
    persistEnv({ TXLINE_LIVE_FIXTURE_ID: String(fid) });
    console.log(`\n── VERDICT: DEVNET CARRIES IT${flowing ? " — LIVE, events flowing" : " — present + in-play state, no stream events in the window"}. Fixture ${fid} pinned to .env.`);
    console.log("next: TXLINE_NETWORK=devnet pnpm --filter worker-ingest dev");
  } else {
    console.log("\n── VERDICT: PRESENT BUT NOT LIVE — fixture exists on devnet but shows no in-play state and no stream events. Mainnet fallback applies.");
  }
}

main().catch((e) => { console.error("DEVNET PROBE FAILED:", e?.message || e); if (e?.logs) console.error(e.logs.join("\n")); process.exit(1); });
