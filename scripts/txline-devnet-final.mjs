// Fetch the FINAL record of a finished devnet fixture (default: Arg–Eng 18241006) using the
// persisted devnet session. Prints the final score + the game_finalised record if present.
//   run: node scripts/txline-devnet-final.mjs [fixtureId]
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
process.loadEnvFile(ROOT + ".env");
const API = "https://txline-dev.txodds.com";
const fid = process.argv[2] ?? "18241006";
const H = { authorization: `Bearer ${process.env.TXLINE_DEVNET_JWT}`, "x-api-token": process.env.TXLINE_DEVNET_API_TOKEN };

const snap = await (await fetch(`${API}/api/scores/snapshot/${fid}`, { headers: H })).json();
const arr = Array.isArray(snap) ? snap : [snap];
console.log(`scores/snapshot/${fid} → ${arr.length} record(s)`);
for (const s of arr.slice(0, 3)) {
  const g = (p) => s.Score?.[p]?.Total?.Goals ?? "?";
  console.log(JSON.stringify({ GameState: s.GameState, StatusId: s.StatusId, Action: s.Action, Seq: s.Seq, Clock: s.Clock, score: `${g("Participant1")}-${g("Participant2")}`, Ts: s.Ts && new Date(s.Ts < 1e12 ? s.Ts * 1000 : s.Ts).toISOString() }));
}
// hunt the game_finalised record in the last hours of updates
const last = arr[0]?.Ts ? (arr[0].Ts < 1e12 ? arr[0].Ts * 1000 : arr[0].Ts) : Date.now();
for (let back = 0; back < 6; back++) {
  const ts = last - back * 3600000;
  const ed = Math.floor(ts / 86400000), hr = Math.floor((ts % 86400000) / 3600000);
  for (let iv = 11; iv >= 0; iv--) {
    const u = await (await fetch(`${API}/api/scores/updates/${ed}/${hr}/${iv}`, { headers: H })).json();
    if (!Array.isArray(u)) continue;
    const fin = u.find((r) => r.FixtureId === Number(fid) && /finalis|final/i.test(r.Action ?? ""));
    if (fin) {
      const g = (p) => fin.Score?.[p]?.Total?.Goals ?? "?";
      console.log("game_finalised FOUND:", JSON.stringify({ Action: fin.Action, GameState: fin.GameState, StatusId: fin.StatusId, Seq: fin.Seq, score: `${g("Participant1")}-${g("Participant2")}`, Ts: new Date(fin.Ts < 1e12 ? fin.Ts * 1000 : fin.Ts).toISOString() }));
      process.exit(0);
    }
  }
}
console.log("no game_finalised record found in the scanned window");
