#!/usr/bin/env node
// Accessibility sweep for the ui-craft loop. Runs axe-core against every route at lg and reports
// violations grouped by rule, so a focus-ring or contrast regression can't ship unseen.
//
// USAGE:  node scripts/ui/axe.mjs            → every route
//         node scripts/ui/axe.mjs /terminal  → one route
//   base URL: process.env.UI_URL (default http://localhost:3000) — start the dev server first.

import { chromium } from "playwright";
import { createRequire } from "node:module";

// axe-core is a devDependency of apps/web (pnpm, not hoisted to the repo root), so resolve from the
// apps/web package context rather than this script's location under scripts/ui/.
const require = createRequire(new URL("../../apps/web/package.json", import.meta.url));
const axePath = require.resolve("axe-core/axe.min.js");

const ROUTES = [
  "/", "/board", "/terminal", "/bracket", "/competition", "/portfolio", "/history",
  "/leaderboard", "/moments", "/proofs", "/how-it-works", "/onboarding", "/settings",
  "/match/wc26-can-mar", "/profile/pitchwizard",
];

const base = process.env.UI_URL ?? "http://localhost:3000";
const routes = process.argv[2] ? [process.argv[2]] : ROUTES;
// Colour-contrast on a dark trading skin is the one we most want to see; keep the full ruleset.
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

let total = 0;
const byRule = new Map();

for (const route of routes) {
  try {
    await page.goto(base + route, { waitUntil: "networkidle", timeout: 30000 });
    // / and /terminal autoplay the ~3.7s halt money-shot on mount. A short wait judges a MID-animation frame
    // (the market dimmed to 0.55 + the amber HALTED wash visible) and reports false contrast failures on a
    // transient beat reduced-motion users never see. Wait for the choreography to SETTLE, exactly as the
    // screenshot harness does — a11y is judged on the resting state. Override with SETTLE for static routes.
    await page.waitForTimeout(Number(process.env.SETTLE ?? 5000));
    await page.addScriptTag({ path: axePath });
    const res = await page.evaluate(async () => {
      // @ts-expect-error injected
      return await window.axe.run(document, { resultTypes: ["violations"] });
    });
    const v = res.violations ?? [];
    const count = v.reduce((n, x) => n + x.nodes.length, 0);
    total += count;
    for (const x of v) {
      const e = byRule.get(x.id) ?? { impact: x.impact, help: x.help, nodes: [] };
      for (const n of x.nodes) e.nodes.push({ route, target: n.target.join(" "), summary: (n.failureSummary ?? "").split("\n")[1]?.trim() ?? "" });
      byRule.set(x.id, e);
    }
    console.log(`${count === 0 ? "✓" : "✗"} ${route.padEnd(24)} ${count} violation${count === 1 ? "" : "s"}`);
  } catch (err) {
    console.log(`! ${route.padEnd(24)} ${err.message.split("\n")[0]}`);
  }
}

console.log(`\n──── ${total} violations across ${routes.length} routes ────`);
for (const [id, e] of [...byRule].sort((a, b) => b[1].nodes.length - a[1].nodes.length)) {
  console.log(`\n${id}  [${e.impact}]  ×${e.nodes.length}  — ${e.help}`);
  for (const n of e.nodes.slice(0, 6)) console.log(`   ${n.route}  ${n.target}\n     ${n.summary}`);
  if (e.nodes.length > 6) console.log(`   … +${e.nodes.length - 6} more`);
}

await browser.close();
process.exit(total > 0 ? 1 : 0);
