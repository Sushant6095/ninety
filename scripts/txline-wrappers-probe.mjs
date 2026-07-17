// TxLINE wrapper probe — verifies EVERY typed wrapper in packages/txline against the REAL devnet feed for
// one fixture. Drives the ACTUAL TxLineClient (not raw fetch) so each wrapper's zod schema parses live
// txline-dev payloads; a schema mismatch surfaces as a FAIL, not a silent pass. ADDITIVE — reads the
// wrappers, changes nothing. Auth reuses the proven guest-JWT → on-chain subscribe → activate handshake
// (scripts/odds-probe.mjs, txline-devnet-argeng.mjs), driven here through the client's own Subscriber/Signer.
//   run: source ~/.nvm/nvm.sh && nvm use 20 && npx tsx scripts/txline-wrappers-probe.mjs [fixtureId]
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createPrivateKey, sign as edSign } from "node:crypto";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { TxLineClient } from "../packages/txline/src/client.ts";

const FIXTURE = String(process.argv[2] ?? "18257865");
const API = "https://txline-dev.txodds.com";
const RPC = "https://api.devnet.solana.com";
const PROGRAM = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const MINT = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const T22 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ATAP = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const SUB_DISC = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
const STREAM_MS = Number(process.env.STREAM_MS ?? 12000);

const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(`${homedir()}/.config/solana/id.json`, "utf8"))));
const conn = new Connection(RPC, "confirmed");
const ata = (o) => PublicKey.findProgramAddressSync([o.toBuffer(), T22.toBuffer(), MINT.toBuffer()], ATAP)[0];
const edB64 = (m) =>
  edSign(null, Buffer.from(m), createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(kp.secretKey.slice(0, 32))]), format: "der", type: "pkcs8" })).toString("base64");

// The client's Subscriber: builds + sends the on-chain txoracle.subscribe(level, weeks) tx (CreateIdempotent ATA
// so re-runs are safe), returns the confirmed signature. This is the real handshake, not a stub.
async function subscribeDevnet(level, weeks) {
  let bal = await conn.getBalance(kp.publicKey);
  process.stderr.write(`wallet ${kp.publicKey.toBase58()} | ${(bal / 1e9).toFixed(4)} SOL (devnet)\n`);
  if (bal < 0.01 * 1e9) {
    try {
      const s = await conn.requestAirdrop(kp.publicKey, 1e9);
      await conn.confirmTransaction(s, "confirmed");
    } catch (e) {
      process.stderr.write(`airdrop failed: ${errMsg(e)}\n`);
    }
  }
  const [pm] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], PROGRAM);
  const [treasury] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], PROGRAM);
  const u = ata(kp.publicKey);
  const createAta = new TransactionInstruction({
    programId: ATAP,
    keys: [
      { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: u, isSigner: false, isWritable: true },
      { pubkey: kp.publicKey, isSigner: false, isWritable: false }, { pubkey: MINT, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, { pubkey: T22, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]), // CreateIdempotent
  });
  const args = Buffer.alloc(3); args.writeUInt16LE(level, 0); args.writeUInt8(weeks, 2);
  const sub = new TransactionInstruction({
    programId: PROGRAM,
    keys: [
      { pubkey: kp.publicKey, isSigner: true, isWritable: true }, { pubkey: pm, isSigner: false, isWritable: false },
      { pubkey: MINT, isSigner: false, isWritable: false }, { pubkey: u, isSigner: false, isWritable: true },
      { pubkey: ata(treasury), isSigner: false, isWritable: true }, { pubkey: treasury, isSigner: false, isWritable: false },
      { pubkey: T22, isSigner: false, isWritable: false }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ATAP, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([SUB_DISC, args]),
  });
  const tx = new Transaction().add(createAta).add(sub);
  tx.feePayer = kp.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
  tx.sign(kp);
  const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
  await conn.confirmTransaction(sig, "confirmed");
  process.stderr.write(`subscribe tx ${sig.slice(0, 12)}…\n`);
  return sig;
}

// Records every HTTP the client makes so each wrapper gets a real status code in the table.
const calls = [];
const recordingFetch = async (url, init) => {
  const res = await fetch(url, init);
  calls.push({ url: String(url), status: res.status });
  return res;
};
const httpSince = (start) => {
  const seg = calls.slice(start);
  return seg.length ? seg[seg.length - 1].status : "—";
};

// Compact error text; ZodError → the exact field paths that failed, so a wrapper schema bug is legible.
const errMsg = (e) => {
  if (e && Array.isArray(e.issues)) {
    const seen = e.issues.slice(0, 3).map((i) => `${i.path.join(".") || "(root)"}=${i.received ?? "?"}(want ${i.expected ?? "?"})`);
    return `zod parse: ${seen.join("; ")}${e.issues.length > 3 ? ` +${e.issues.length - 3} more` : ""}`;
  }
  return String(e?.message ?? e);
};

const rows = [];
const row = (wrapper, http, result) => {
  rows.push({ wrapper, http, result });
  process.stderr.write(`  ${wrapper.padEnd(22)} HTTP ${String(http).padEnd(4)} ${result}\n`);
};

// Tap an SSE wrapper (scoresStream / oddsStream) for STREAM_MS; count total events + fixture matches.
async function tapStream(gen, label, startIdx) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), STREAM_MS);
  let total = 0, mine = 0, firstSeq;
  try {
    for await (const ev of gen(ac.signal)) {
      total++;
      if (ev?.FixtureId === Number(FIXTURE)) {
        mine++;
        if (firstSeq === undefined && typeof ev.Seq === "number") firstSeq = ev.Seq;
      }
    }
  } catch (e) {
    if (e?.name !== "AbortError") {
      clearTimeout(timer);
      return { http: httpSince(startIdx), result: `FAIL — ${errMsg(e)}`.slice(0, 170), firstSeq };
    }
  } finally {
    clearTimeout(timer);
  }
  const http = httpSince(startIdx);
  const why = mine > 0 ? `real data — ${mine}/${total} events for ${FIXTURE}` : `empty — 0/${total} events for ${FIXTURE} in ${STREAM_MS / 1000}s (pre-match/quiet feed)`;
  return { http, result: why, firstSeq };
}

async function main() {
  process.stderr.write(`\n== TxLINE wrapper probe · fixture ${FIXTURE} · ${API} ==\n`);
  const client = new TxLineClient({
    cluster: "devnet",
    fetch: recordingFetch,
    subscriber: { subscribe: ({ level, weeks }) => subscribeDevnet(level, weeks) },
    signer: { publicKey: kp.publicKey.toBase58(), sign: async (m) => edB64(m) },
  });

  // auth — the client's own handshake (guest/start → subscribe → activate)
  let s0 = calls.length;
  try {
    const sess = await client.authenticate();
    row("auth", httpSince(s0), `real — apiToken ${sess.apiToken.slice(0, 4)}…${sess.apiToken.slice(-4)} (${sess.apiToken.length} chars)`);
  } catch (e) {
    row("auth", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
    printTable();
    return;
  }

  // F1 — fixtures/snapshot
  let target;
  s0 = calls.length;
  try {
    const fx = await client.fixtures();
    const arr = Array.isArray(fx) ? fx : [];
    target = arr.find((f) => Number(f.FixtureId) === Number(FIXTURE));
    const nm = target ? `${target.Participant1 ?? "?"} v ${target.Participant2 ?? "?"}` : "not in set";
    row("F1 fixtures/snapshot", httpSince(s0), `real data — ${arr.length} fixtures · ${FIXTURE} ${target ? "PRESENT (" + nm + ")" : "ABSENT"}`);
  } catch (e) {
    row("F1 fixtures/snapshot", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
  }

  // S1 — scores/snapshot/{fixture}
  let snapSeq;
  s0 = calls.length;
  try {
    const snap = await client.scoresSnapshot(FIXTURE);
    if (snap.length) {
      const last = snap[snap.length - 1];
      snapSeq = last?.Seq;
      row("S1 scoresSnapshot", httpSince(s0), `real data — ${snap.length} records · last GameState=${JSON.stringify(last?.GameState)} Seq=${last?.Seq}`);
    } else {
      row("S1 scoresSnapshot", httpSince(s0), `empty — [] (pre-match: fixture has no score records yet)`);
    }
  } catch (e) {
    row("S1 scoresSnapshot", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
  }

  // S3 — scores/stream (SSE) — tap first so we can harvest a live Seq for S4 if the feed is flowing
  s0 = calls.length;
  const sTap = await tapStream((sig) => client.scoresStream({ signal: sig }), "S3 scoresStream", s0);
  row("S3 scoresStream", sTap.http, sTap.result);
  const seqForProof = snapSeq ?? sTap.firstSeq;

  // S2 — scores/updates/{epochDay}/{hour}/{interval} — current 5-min bucket (UTC)
  const now = new Date();
  const epochDay = Math.floor(Date.now() / 86_400_000);
  const hour = now.getUTCHours();
  const interval = Math.floor(now.getUTCMinutes() / 5);
  s0 = calls.length;
  try {
    const upd = await client.scoresUpdates(epochDay, hour, interval);
    const mine = upd.filter((u) => Number(u.FixtureId) === Number(FIXTURE)).length;
    row("S2 scoresUpdates", httpSince(s0), upd.length ? `real data — ${upd.length} events in bucket ${epochDay}/${hour}/${interval} (${mine} for ${FIXTURE})` : `empty — [] for bucket ${epochDay}/${hour}/${interval} (no scores in this 5-min window)`);
  } catch (e) {
    row("S2 scoresUpdates", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
  }

  // S4 — scores/stat-validation?fixtureId&seq&statKeys=1,2 — needs a real Seq
  s0 = calls.length;
  if (seqForProof === undefined) {
    row("S4 statValidation", "—", `empty — no Seq available (pre-match: no score record to prove; needs a game Seq)`);
  } else {
    try {
      const proof = await client.statValidation(FIXTURE, seqForProof, 1, 2);
      row("S4 statValidation", httpSince(s0), `real data — proof for Seq=${seqForProof} statKeys 1,2 · statProof nodes=${proof.statProof?.length ?? 0}`);
    } catch (e) {
      row("S4 statValidation", httpSince(s0), `empty-why — no proof for Seq=${seqForProof}: ${errMsg(e)}`.slice(0, 170));
    }
  }

  // O1 — odds/snapshot/{fixture}
  s0 = calls.length;
  try {
    const os = await client.oddsSnapshot(FIXTURE);
    if (os.length) {
      const types = [...new Set(os.map((t) => t.SuperOddsType))].join(",");
      row("O1 oddsSnapshot", httpSince(s0), `real data — ${os.length} ticks · types=[${types}]`);
    } else {
      row("O1 oddsSnapshot", httpSince(s0), `empty — [] (pre-match: no odds posted for ${FIXTURE} yet)`);
    }
  } catch (e) {
    row("O1 oddsSnapshot", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
  }

  // O2 — odds/updates/{epochDay}/{hour}/{interval}
  s0 = calls.length;
  try {
    const upd = await client.oddsUpdates(epochDay, hour, interval);
    const mine = upd.filter((u) => Number(u.FixtureId) === Number(FIXTURE)).length;
    const types = [...new Set(upd.map((t) => t.SuperOddsType))].slice(0, 4).join(",");
    row("O2 oddsUpdates", httpSince(s0), upd.length ? `real data — ${upd.length} ticks in bucket ${epochDay}/${hour}/${interval} (${mine} for ${FIXTURE}) types=[${types}]` : `empty — [] for bucket ${epochDay}/${hour}/${interval}`);
  } catch (e) {
    row("O2 oddsUpdates", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
  }

  // O3 — odds/stream (SSE)
  s0 = calls.length;
  const oTap = await tapStream((sig) => client.oddsStream({ signal: sig }), "O3 oddsStream", s0);
  row("O3 oddsStream", oTap.http, oTap.result);

  // settlementProof — composite (S1 → find game_finalised → S4). Pre-match ⇒ null (not finalised).
  s0 = calls.length;
  try {
    const proof = await client.settlementProof(FIXTURE);
    if (proof === null) {
      row("settlementProof", httpSince(s0), `empty — null (fixture not finalised: no game_finalised record — correct pre-match behaviour)`);
    } else {
      row("settlementProof", httpSince(s0), `real data — home ${proof.home} away ${proof.away} result=${proof.result} level=${proof.levelScore}`);
    }
  } catch (e) {
    row("settlementProof", httpSince(s0), `FAIL — ${errMsg(e)}`.slice(0, 170));
  }

  printTable();
}

function printTable() {
  process.stdout.write(`\n| wrapper | HTTP | result (real data / empty-why / FAIL) |\n`);
  process.stdout.write(`|---|---|---|\n`);
  for (const r of rows) process.stdout.write(`| ${r.wrapper} | ${r.http} | ${r.result} |\n`);
  process.stdout.write(`\n`);
}

main().catch((e) => {
  console.error("PROBE FAILED:", e?.message || e);
  if (rows.length) printTable();
  process.exit(1);
});
