// Pass-2 registry puller (dashboard/components pass): web3-dashboard (watermelon, MIT) +
// dotm-square-3 (dotmatrix, custom-proprietary: app embedding permitted) + dithered-logo
// (componentry, MIT) into src/components/vendor/, and notio (styleui, license undeclared) into
// design/reference/notio/ — STRUCTURE STUDY ONLY, never part of the build (flag 3: no template ships).
//   run: node scripts/pull-registry-pass2.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join, dirname } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const VENDOR = [
  ["watermelon", "web3-dashboard", "https://raw.githubusercontent.com/WatermelonCorp/watermellon-registry/main/public/r/web3-dashboard.json"],
  ["dotmatrix", "dotm-square-3", "https://dotmatrix.zzzzshawn.cloud/r/dotm-square-3.json"],
  ["componentry", "dithered-logo", "https://componentry.dev/r/dithered-logo.json"],
];

for (const [reg, name, url] of VENDOR) {
  const j = await (await fetch(url, { headers: { accept: "application/json" } })).json();
  const dir = join(ROOT, "src/components/vendor", reg);
  for (const f of j.files ?? []) {
    const file = join(dir, name === "web3-dashboard" ? f.path.replace(/^src\/components\/dashboards\/web3-dashboard\//, "") : basename(f.path));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, f.content);
    console.log(`PULLED ${reg}/${name} → ${file.replace(ROOT, "")} (${f.content.length}b)`);
  }
  console.log(`  deps=${JSON.stringify(j.dependencies ?? [])} regDeps=${JSON.stringify(j.registryDependencies ?? [])}`);
}

// notio → reference only (outside src): the structure is the deliverable, the code never ships.
const n = await (await fetch("https://styleui.dev/r/notio.json", { headers: { accept: "application/json" } })).json();
const refDir = join(ROOT, "../../design/reference/notio");
for (const f of n.files ?? []) {
  const file = join(refDir, f.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, f.content);
}
console.log(`PULLED styleui/notio → design/reference/notio/ (${(n.files ?? []).length} files, STRUCTURE STUDY ONLY)`);
