// Registry puller (component pass, ADR pending): fetches shadcn-registry JSON items from magicui /
// skiper-ui / godui.design and writes RAW sources under src/components/vendor/{registry}/ for a
// MANDATORY re-skin pass (tokens, framer-motion imports, reduced-motion) — raw output is NOT shippable.
// The godui theme regDep is deliberately NOT written: Ninety tokens are the only palette (design law).
//   run: node scripts/pull-registry-components.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "src/components/vendor");

const ITEMS = [
  // magicui — https://magicui.design/r/{name}.json
  ...["marquee", "bento-grid", "avatar-circles", "magic-card", "terminal", "dock", "video-text", "hyper-text", "highlighter", "scroll-based-velocity", "dotted-map", "backlight", "confetti"].map(
    (n) => ["magicui", n, `https://magicui.design/r/${n}.json`],
  ),
  // skiper — https://skiper-ui.com/registry/{name}.json
  ...["skiper19", "skiper39", "skiper52"].map((n) => ["skiper", n, `https://skiper-ui.com/registry/${n}.json`]),
  // godui — https://godui.design/r/{name}.json (theme regDep intentionally skipped)
  ...["notification-inbox", "sticky-scroll", "animated-beam", "agent-flow", "agent-timeline", "holographic-card", "particle-dissolve", "flow-field"].map(
    (n) => ["godui", n, `https://godui.design/r/${n}.json`],
  ),
];

const HAVE = new Set(["framer-motion", "gsap", "@gsap/react", "next", "react", "react-dom", "lucide-react", "three", "radix-ui"]);
const deps = new Map(); // dep → [items]

for (const [reg, name, url] of ITEMS) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    console.log(`MISS ${reg}/${name} → ${res.status}`);
    continue;
  }
  const j = await res.json();
  for (const d of j.dependencies ?? []) if (!HAVE.has(d)) deps.set(d, [...(deps.get(d) ?? []), name]);
  const dir = join(OUT, reg);
  mkdirSync(dir, { recursive: true });
  for (const f of j.files ?? []) {
    const file = join(dir, basename(f.path));
    writeFileSync(file, f.content);
    console.log(`PULLED ${reg}/${name} → ${file.replace(ROOT, "")} (${f.content.length}b, deps=${JSON.stringify(j.dependencies ?? [])})`);
  }
  if ((j.files ?? []).length === 0) console.log(`EMPTY ${reg}/${name} — no files in registry item`);
}

console.log("\nNEW npm deps needed (not already installed):");
for (const [d, items] of deps) console.log(`  ${d}  ← ${items.join(", ")}`);
console.log('\nNOTE: any "motion" dep will be REWRITTEN to framer-motion in the re-skin pass (two-lib law).');
