#!/usr/bin/env node
// UI screenshot harness for the ui-craft loop. Captures a route at four breakpoints into
// design/screens/impl/ so the design-cop agent can judge against the design/screens/ reference.
//
// SETUP (one-time, only when the network is confirmed OK):
//   pnpm add -D playwright && npx playwright install chromium
//
// USAGE:
//   node scripts/ui/screenshot.mjs <route> <name>
//   e.g. node scripts/ui/screenshot.mjs /match/wc26-bra-arg match-live
//   base URL: process.env.UI_URL (default http://localhost:3000) — start the dev server first.
//
// BASELINE NOTE (thin, by design): an approved screen can later be LOCKED for regression via
// Playwright's `toHaveScreenshot()` diffing. That is the whole baseline story — we do NOT build a
// versioned screenshot database or an auto-task generator here; that is explicitly out of scope
// (team-scale only). This file just captures shots for the human + design-cop to look at.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const SIZES = {
  sm: { width: 390, height: 844 }, // phone
  md: { width: 768, height: 1024 }, // tablet
  lg: { width: 1280, height: 800 }, // laptop
  xl: { width: 1536, height: 960 }, // desktop
};

async function main() {
  const [route, name] = process.argv.slice(2);
  if (!route || !name) {
    console.error("usage: node scripts/ui/screenshot.mjs <route> <name>");
    process.exit(1);
  }
  const base = process.env.UI_URL ?? "http://localhost:3000";
  const outDir = "design/screens/impl";
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    for (const [key, size] of Object.entries(SIZES)) {
      const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });
      const url = base + route;
      await page.goto(url, { waitUntil: "networkidle" });
      const path = `${outDir}/${name}.${key}.png`;
      // sm = above-the-fold (viewport) so the phone hero is judged as seen; md/lg/xl = fullPage.
      await page.screenshot({ path, fullPage: key !== "sm" });
      await page.close();
      console.log(`✓ ${key.padEnd(2)} ${size.width}×${size.height}  →  ${path}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("✗ screenshot failed:", err?.message ?? err);
  process.exit(1);
});
