// One-off probe: what odds market types does the live feed carry, and which is the 1X2 (match result)?
// Taps the odds SSE stream, tallies SuperOddsType, saves one example tick per type.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createPrivateKey, sign as edSign } from "node:crypto";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";

const API = "https://txline-dev.txodds.com", RPC = "https://api.devnet.solana.com";
const PROGRAM = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const MINT = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const T22 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"), ATAP = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8"))));
const conn = new Connection(RPC, "confirmed");
const ata = (o) => PublicKey.findProgramAddressSync([o.toBuffer(), T22.toBuffer(), MINT.toBuffer()], ATAP)[0];
const edB64 = (m) => edSign(null, Buffer.from(m), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(kp.secretKey.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");

async function auth() {
  const [tPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
  const [pm] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
  const u = ata(kp.publicKey), vault = ata(tPda), a = Buffer.alloc(3); a.writeUInt16LE(1, 0); a.writeUInt8(4, 2);
  const mk = (keys, data, pid) => new TransactionInstruction({ programId: pid, keys, data });
  const createAta = mk([[kp.publicKey, 1, 1], [u, 0, 1], [kp.publicKey, 0, 0], [MINT, 0, 0], [SystemProgram.programId, 0, 0], [T22, 0, 0]].map(([pubkey, s, w]) => ({ pubkey, isSigner: !!s, isWritable: !!w })), Buffer.from([1]), ATAP);
  const sub = mk([[kp.publicKey, 1, 1], [pm, 0, 0], [MINT, 0, 0], [u, 0, 1], [vault, 0, 1], [tPda, 0, 0], [T22, 0, 0], [SystemProgram.programId, 0, 0], [ATAP, 0, 0]].map(([pubkey, s, w]) => ({ pubkey, isSigner: !!s, isWritable: !!w })), Buffer.concat([Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]), a]), PROGRAM);
  const tx = new Transaction().add(createAta).add(sub); tx.feePayer = kp.publicKey; tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash; tx.sign(kp);
  const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" }); await conn.confirmTransaction(sig, "confirmed");
  const jwt = (await (await fetch(`${API}/auth/guest/start`, { method: "POST" })).json()).token;
  const r = await (await fetch(`${API}/api/token/activate`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` }, body: JSON.stringify({ txSig: sig, walletSignature: edB64(`${sig}::${jwt}`), leagues: [] }) })).text();
  let apiToken; try { apiToken = JSON.parse(r).token || JSON.parse(r); } catch { apiToken = r.trim(); }
  return { authorization: `Bearer ${jwt}`, "x-api-token": apiToken };
}

async function main() {
  const H = await auth();
  const ac = new AbortController(); setTimeout(() => ac.abort(), 25000);
  const res = await fetch(`${API}/api/odds/stream`, { headers: { ...H, accept: "text/event-stream" }, signal: ac.signal });
  const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
  const types = {}, examples = {};
  try {
    for (;;) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true });
      let i; while ((i = buf.indexOf("\n\n")) >= 0) { const f = buf.slice(0, i); buf = buf.slice(i + 2);
        const d = f.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join(""); if (!d) continue;
        let e; try { e = JSON.parse(d); } catch { continue; } if (!e.SuperOddsType) continue;
        types[e.SuperOddsType] = (types[e.SuperOddsType] || 0) + 1; examples[e.SuperOddsType] ??= e;
      } }
  } catch {}
  console.log("SuperOddsType counts:", JSON.stringify(types, null, 1));
  for (const [t, e] of Object.entries(examples)) console.log(`  ${t}: PriceNames=${JSON.stringify(e.PriceNames)} MarketParameters=${e.MarketParameters} Prices=${JSON.stringify(e.Prices)}`);
  // save a 1X2/match-result example if present
  const oneX2 = Object.entries(examples).find(([t, e]) => /1X2|MATCH|THREE|RESULT|WIN.*DRAW|WDW/i.test(t) || (e.PriceNames?.length === 3 && /home|draw|away|^1$|^x$|^2$/i.test(e.PriceNames.join())));
  if (oneX2) { writeFileSync(fileURLToPath(new URL("../docs/txline-samples/odds-1x2-stream.json", import.meta.url)), JSON.stringify(oneX2[1], null, 2) + "\n"); console.log("\nsaved 1X2 example:", oneX2[0]); }
  else console.log("\nNO obvious 1X2/match-result market seen in window");
}
main().catch((e) => { console.error("PROBE FAILED:", e?.message || e); process.exit(1); });
