// Bake every flag in FIFA_TO_ISO from flagcdn into public/flags/{w80,w160}/{iso}.png.
// One-time (re-run when the map grows): kills the runtime CDN dependency. Fails loudly on any 404.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const flagsTs = readFileSync(path.join(root, "../src/lib/flags.ts"), "utf8");

// Parse the map straight out of flags.ts so there is exactly one source of truth.
const mapBlock = flagsTs.slice(flagsTs.indexOf("FIFA_TO_ISO"), flagsTs.indexOf("};"));
const isos = [...new Set([...mapBlock.matchAll(/:\s*"([a-z-]+)"/g)].map((m) => m[1]))];
if (isos.length < 48) throw new Error(`bake-flags: parsed only ${isos.length} slugs from flags.ts — parser broke?`);

const widths = [80, 160];
for (const w of widths) mkdirSync(path.join(root, `../public/flags/w${w}`), { recursive: true });

let ok = 0;
const failures = [];
const jobs = isos.flatMap((iso) => widths.map((w) => ({ iso, w })));
// ponytail: batches of 6 — a full 116-way burst trips Cloudflare/local connection limits.
for (let i = 0; i < jobs.length; i += 6) {
  await Promise.all(
    jobs.slice(i, i + 6).map(async ({ iso, w }) => {
      const dest = path.join(root, `../public/flags/w${w}/${iso}.png`);
      if (existsSync(dest) && statSync(dest).size > 100) {
        ok++;
        return;
      }
      const url = `https://flagcdn.com/w${w}/${iso}.png`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        ok++;
      } catch (err) {
        failures.push(`${url} → ${err.message}`);
      }
    }),
  );
}

if (failures.length) {
  console.error(`bake-flags: ${failures.length} FAILED downloads:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`bake-flags: baked ${ok} PNGs (${isos.length} flags × ${widths.length} widths) into public/flags/`);
