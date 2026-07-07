// LIVE (world) verification runner — composition layer. Manual counterpart to the mock CI test
// (packages/txline/scripts/snapshot.ts). Runs the real flow on devnet + txline-dev: create ATA +
// subscribe(SL1,4) → guest JWT → sign → activate → capture fixtures/scores/odds/stat-validation + tap
// the SSE streams, refreshing docs/txline-samples/*.json and logging a FRESHNESS verdict (SL1 latency).
//   run:  node scripts/txline-live.mjs          (needs funded devnet wallet ~/.config/solana/id.json)
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
const LEVEL = 1, WEEKS = 4, LEAGUES = [];
const STREAM_MS = Number(process.env.STREAM_MS ?? 30000);
const SAMPLES = fileURLToPath(new URL("../docs/txline-samples/", import.meta.url));

const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8"))));
const conn = new Connection(RPC, "confirmed");
const ata = (o) => PublicKey.findProgramAddressSync([o.toBuffer(), TOKEN_2022.toBuffer(), MINT.toBuffer()], ATA_PROG)[0];
const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
const [pricingPda] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
const userAta = ata(kp.publicKey), treasuryVault = ata(treasuryPda);
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u8 = (n) => { const b = Buffer.alloc(1); b.writeUInt8(n); return b; };
const edB64 = (m, sk) => edSign(null, Buffer.from(m), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(sk.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");
const save = (name, obj) => { const o = Array.isArray(obj) ? obj.slice(0, 3) : obj; writeFileSync(SAMPLES + name + ".json", JSON.stringify(o, null, 2) + "\n"); console.log("  saved", name + ".json", Array.isArray(obj) ? `(${obj.length}→${o.length})` : ""); };

async function getJson(path, H, saveAs) {
  const res = await fetch(`${API}${path}`, { headers: H });
  const txt = await res.text(); let j; try { j = JSON.parse(txt); } catch { j = txt; }
  console.log(`GET ${path} → ${res.status}${Array.isArray(j) ? ` [${j.length}]` : ""}`);
  if (saveAs && res.ok && !(Array.isArray(j) && j.length === 0)) save(saveAs, j);
  return j;
}

// Tap an SSE stream for STREAM_MS, record arrival wall-time per event, save the first, return events.
async function tapStream(path, H, saveAs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), STREAM_MS);
  const events = [];
  let saved = false;
  try {
    const res = await fetch(`${API}${path}`, { headers: { ...H, accept: "text/event-stream" }, signal: ac.signal });
    if (!res.ok || !res.body) { console.log(`SSE ${path} → ${res.status}`); return events; }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
        if (!data) continue;
        let ev; try { ev = JSON.parse(data); } catch { continue; }
        events.push({ arrival: Date.now(), ev });
        // save the first REAL event (has FixtureId), not a `{Ts}` keepalive
        if (!saved && saveAs && ev && ev.FixtureId != null) { save(saveAs, ev); saved = true; }
      }
    }
  } catch (e) { if (e.name !== "AbortError") console.log(`SSE ${path} error:`, e.message); }
  finally { clearTimeout(timer); }
  console.log(`SSE ${path} → ${events.length} events in ${STREAM_MS / 1000}s`);
  return events;
}

async function main() {
  mkdirSync(SAMPLES, { recursive: true });
  console.log("wallet:", kp.publicKey.toBase58(), "| bal:", (await conn.getBalance(kp.publicKey)) / 1e9, "SOL");

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
  const sub = new TransactionInstruction({ programId: PROGRAM, keys, data: Buffer.concat([SUBSCRIBE_DISC, u16(LEVEL), u8(WEEKS)]) });
  const tx = new Transaction().add(createAta).add(sub);
  tx.feePayer = kp.publicKey; tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash; tx.sign(kp);
  const txSig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction(txSig, "confirmed");
  console.log("SUBSCRIBE tx:", txSig);

  const jwt = (await (await fetch(`${API}/auth/guest/start`, { method: "POST" })).json()).token;
  const act = await fetch(`${API}/api/token/activate`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` }, body: JSON.stringify({ txSig, walletSignature: edB64(`${txSig}:${LEAGUES.join(",")}:${jwt}`, kp.secretKey), leagues: LEAGUES }) });
  const at = await act.text(); let apiToken; try { const j = JSON.parse(at); apiToken = j.token || j.apiToken || j; } catch { apiToken = at.trim(); }
  console.log("activate →", act.status, "\n");
  const H = { authorization: `Bearer ${jwt}`, "x-api-token": apiToken };

  console.log("== capture ==");
  const fixtures = await getJson("/api/fixtures/snapshot", H);
  const arr = Array.isArray(fixtures) ? fixtures : [];
  // representative sample: prefer World Cup fixtures (save() trims to 3)
  save("fixtures-snapshot", [...arr.filter((f) => f.CompetitionId === 72), ...arr.filter((f) => f.CompetitionId !== 72)]);
  // log in-play candidates (GameState signals liveness)
  const live = arr.filter((f) => f.GameState && f.GameState !== 0 && f.GameState !== "scheduled");
  console.log(`fixtures: ${arr.length} total, ${live.length} with a non-scheduled GameState`);
  for (const f of arr.slice(0, 8)) console.log(`  ${f.FixtureId} ${f.Participant1} v ${f.Participant2} | ${f.Competition} | GameState=${JSON.stringify(f.GameState)} | start ${new Date(f.StartTime).toISOString()}`);
  const wc = live.find((f) => f.CompetitionId === 72) || arr.find((f) => f.CompetitionId === 72) || arr[0];
  const fid = wc?.FixtureId;
  console.log("chosen fixtureId:", fid, wc && `(${wc.Participant1} v ${wc.Participant2}, GameState=${JSON.stringify(wc.GameState)})`);

  const scores = await getJson(`/api/scores/snapshot/${fid}`, H, "scores-snapshot");
  const s0 = Array.isArray(scores) ? scores[0] : scores;
  await getJson(`/api/odds/snapshot/${fid}`, H, "odds-snapshot");
  if (s0?.Ts) {
    const ts = s0.Ts, ed = Math.floor(ts / 86400000), hr = Math.floor((ts % 86400000) / 3600000), iv = Math.floor((ts % 3600000) / 300000);
    await getJson(`/api/scores/updates/${ed}/${hr}/${iv}`, H, "scores-updates");
    await getJson(`/api/odds/updates/${ed}/${hr}/${iv}`, H, "odds-updates");
    if (s0.Seq != null) await getJson(`/api/scores/stat-validation?fixtureId=${fid}&seq=${s0.Seq}&statKey=1002`, H, "scores-stat-validation");
  }

  console.log(`\n== tap SSE streams for ${STREAM_MS / 1000}s (freshness) ==`);
  const [sc, od] = await Promise.all([tapStream(`/api/scores/stream`, H, "scores-stream-event"), tapStream(`/api/odds/stream`, H, "odds-stream-event")]);

  console.log("\n── FRESHNESS ──");
  const normMs = (ts) => (ts < 1e12 ? ts * 1000 : ts); // scores Ts is seconds, odds Ts is ms
  const report = (label, evs) => {
    if (!evs.length) { console.log(`${label}: 0 events (no emission during window)`); return; }
    const real = evs.filter((e) => e.ev && e.ev.FixtureId != null).length;
    const lags = evs.map((e) => (typeof e.ev.Ts === "number" ? e.arrival - normMs(e.ev.Ts) : null)).filter((x) => x != null && x >= 0 && x < 3600000);
    const med = lags.length ? lags.sort((a, b) => a - b)[Math.floor(lags.length / 2)] : null;
    console.log(`${label}: ${evs.length} events (${real} real, ${evs.length - real} keepalive) | median transport lag (arrival-Ts) = ${med != null ? (med / 1000).toFixed(2) + "s" : "n/a"}`);
  };
  report("scores.stream", sc);
  report("odds.stream", od);
  console.log("\n(transport lag = feed-emit → client. The SL1 tier's documented 60s delay is data-vs-real-match, not transport.)");
  console.log("✓ LIVE run complete for fixture", fid);
}
main().catch((e) => { console.error("LIVE FAILED:", e?.message || e); if (e?.logs) console.error(e.logs.join("\n")); process.exit(1); });
