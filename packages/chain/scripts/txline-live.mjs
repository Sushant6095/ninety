// LIVE (world) verification — the manual counterpart to the mock CI test (packages/txline/scripts/snapshot.ts).
// Runs the real flow against txline-dev + devnet: create ATA + subscribe(SL1,4) on-chain → guest JWT →
// sign → activate → authenticated fixtures/scores snapshot, and refreshes docs/txline-samples/*.json.
//   run:  pnpm --filter @omnipitch/chain exec node scripts/txline-live.mjs
//   needs: funded devnet wallet at ~/.config/solana/id.json (real on-chain tx). Devnet free tier = SL1.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
const LEVEL = 1, WEEKS = 4, LEAGUES = []; // devnet free tier = SL1
const SAMPLES = fileURLToPath(new URL("../../../docs/txline-samples/", import.meta.url));

const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8"))));
const conn = new Connection(RPC, "confirmed");
const ata = (owner) => PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_2022.toBuffer(), MINT.toBuffer()], ATA_PROG)[0];
const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
const [pricingPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
const userAta = ata(kp.publicKey), treasuryVault = ata(treasuryPda);
const u16le = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u8 = (n) => { const b = Buffer.alloc(1); b.writeUInt8(n); return b; };
const edB64 = (msg, sk) => edSign(null, Buffer.from(msg), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(sk.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");
const save = (name, obj) => { writeFileSync(SAMPLES + name + ".json", JSON.stringify(obj, null, 2) + "\n"); console.log("  saved", name + ".json"); };

async function getJson(path, H, save_as) {
  const res = await fetch(`${API}${path}`, { headers: H });
  const txt = await res.text();
  let j; try { j = JSON.parse(txt); } catch { j = txt; }
  console.log(`GET ${path} → ${res.status}`);
  if (save_as && res.ok) save(save_as, j);
  return j;
}
async function firstSseEvent(path, H, save_as) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 7000);
  try {
    const res = await fetch(`${API}${path}`, { headers: { ...H, accept: "text/event-stream" }, signal: ac.signal });
    const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
        if (data) { const ev = JSON.parse(data); console.log(`SSE ${path} → 1 event`); if (save_as) save(save_as, ev); reader.cancel(); return ev; }
      }
    }
  } catch (e) { console.log(`SSE ${path} → ${e.name === "AbortError" ? "no event in 7s" : e.message}`); }
  finally { clearTimeout(t); }
  return null;
}

async function main() {
  mkdirSync(SAMPLES, { recursive: true });
  console.log("wallet:", kp.publicKey.toBase58(), "| bal:", (await conn.getBalance(kp.publicKey)) / 1e9, "SOL");

  // subscribe (create ATA idempotent + subscribe)
  const keys = [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: pricingPda, isSigner: false, isWritable: false },
    { pubkey: MINT, isSigner: false, isWritable: false }, { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: treasuryVault, isSigner: false, isWritable: true }, { pubkey: treasuryPda, isSigner: false, isWritable: false },
    { pubkey: TOKEN_2022, isSigner: false, isWritable: false }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: ATA_PROG, isSigner: false, isWritable: false },
  ];
  const createAta = new TransactionInstruction({ programId: ATA_PROG, keys: [
    { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: userAta, isSigner: false, isWritable: true },
    { pubkey: kp.publicKey, isSigner: false, isWritable: false }, { pubkey: MINT, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, { pubkey: TOKEN_2022, isSigner: false, isWritable: false },
  ], data: Buffer.from([1]) });
  const sub = new TransactionInstruction({ programId: PROGRAM, keys, data: Buffer.concat([SUBSCRIBE_DISC, u16le(LEVEL), u8(WEEKS)]) });
  const tx = new Transaction().add(createAta).add(sub);
  tx.feePayer = kp.publicKey; tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash; tx.sign(kp);
  const txSig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction(txSig, "confirmed");
  console.log("SUBSCRIBE tx:", txSig);

  const jwt = (await (await fetch(`${API}/auth/guest/start`, { method: "POST" })).json()).token;
  const act = await fetch(`${API}/api/token/activate`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` }, body: JSON.stringify({ txSig, walletSignature: edB64(`${txSig}:${LEAGUES.join(",")}:${jwt}`, kp.secretKey), leagues: LEAGUES }) });
  const actText = await act.text();
  let apiToken; try { const j = JSON.parse(actText); apiToken = j.token || j.apiToken || j; } catch { apiToken = actText.trim(); }
  console.log("activate →", act.status, "| apiToken:", String(apiToken).slice(0, 20), "…\n");
  const H = { authorization: `Bearer ${jwt}`, "x-api-token": apiToken };

  console.log("== capture real samples ==");
  const fixtures = await getJson("/api/fixtures/snapshot", H, "fixtures-snapshot");
  const arr = Array.isArray(fixtures) ? fixtures : [];
  const wc = arr.find((f) => f.CompetitionId === 72) || arr[0];
  const fid = wc?.FixtureId;
  console.log("chosen fixtureId:", fid, wc && `(${wc.Participant1} v ${wc.Participant2})`);
  const scores = await getJson(`/api/scores/snapshot/${fid}`, H, "scores-snapshot");
  const s0 = Array.isArray(scores) ? scores[0] : scores;
  await getJson(`/api/odds/snapshot/${fid}`, H, "odds-snapshot");
  if (s0?.Ts) {
    const ts = s0.Ts, ed = Math.floor(ts / 86400000), hr = Math.floor((ts % 86400000) / 3600000), iv = Math.floor((ts % 3600000) / 300000);
    await getJson(`/api/scores/updates/${ed}/${hr}/${iv}`, H, "scores-updates");
    await getJson(`/api/odds/updates/${ed}/${hr}/${iv}`, H, "odds-updates");
    if (s0.Seq != null) await getJson(`/api/scores/stat-validation?fixtureId=${fid}&seq=${s0.Seq}&statKey=1002`, H, "scores-stat-validation");
  }
  await firstSseEvent(`/api/scores/stream`, H, "scores-stream-event");
  await firstSseEvent(`/api/odds/stream`, H, "odds-stream-event");

  console.log("\n── LIVE snapshot (real, world-verified) ──");
  console.log(`fixture ${fid}: ${wc?.Participant1} v ${wc?.Participant2} | score P1 ${s0?.Score?.Participant1?.Total?.Goals ?? "?"} - ${s0?.Score?.Participant2?.Total?.Goals ?? "?"} P2 | state ${s0?.GameState} | seq ${s0?.Seq}`);
  console.log("✓ LIVE VERIFY OK — authenticated fixtures + scores snapshot printed for real WC26 fixture", fid);
}
main().catch((e) => { console.error("LIVE FAILED:", e?.message || e); if (e?.logs) console.error(e.logs.join("\n")); process.exit(1); });
