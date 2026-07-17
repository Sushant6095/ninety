// One-shot: vendor the MAINNET txoracle IDL from the vendor's own repo (same source as the devnet
// IDL, ADR-037 UPDATE). Tries the mainnet examples path, falls back to listing the repo tree.
import { writeFileSync } from "node:fs";

const tryUrls = [
  "https://raw.githubusercontent.com/txodds/tx-on-chain/main/examples/mainnet/idl/txoracle.json",
  "https://raw.githubusercontent.com/txodds/tx-on-chain/master/examples/mainnet/idl/txoracle.json",
];
for (const u of tryUrls) {
  try {
    const r = await fetch(u);
    if (!r.ok) { console.log("miss", r.status, u); continue; }
    const idl = await r.json();
    console.log("HIT", u, "| address:", idl.address, "| version:", idl.metadata?.version);
    writeFileSync(process.argv[2], JSON.stringify(idl, null, 2));
    process.exit(0);
  } catch (e) { console.log("err", u, e.message.slice(0, 80)); }
}
// fallback: list tree to find where mainnet idl lives
for (const branch of ["main", "master"]) {
  try {
    const r = await fetch(`https://api.github.com/repos/txodds/tx-on-chain/git/trees/${branch}?recursive=1`);
    if (!r.ok) continue;
    const t = await r.json();
    const hits = t.tree.filter((n) => /idl|mainnet/i.test(n.path)).map((n) => n.path);
    console.log("tree hits:", JSON.stringify(hits.slice(0, 30), null, 1));
    break;
  } catch (e) { console.log("tree err", e.message.slice(0, 80)); }
}
