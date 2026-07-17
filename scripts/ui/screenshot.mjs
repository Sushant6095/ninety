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

  // /terminal and / autoplay the halt money-shot on mount, so `networkidle` alone catches the market MID-STORY
  // — a flat, goalless, pre-goal frame the user sees for barely a second. Shoot the RESTING state instead: wait
  // for the choreography to land and settle. Override with SETTLE=0 for a static route you want captured fast.
  const settle = Number(process.env.SETTLE ?? 7000);
  // Mobile is out of scope for the current gates — ONLY=lg,xl skips the breakpoints nobody is judging.
  const only = process.env.ONLY?.split(",").map((s) => s.trim()).filter(Boolean);
  const sizes = Object.entries(SIZES).filter(([k]) => !only || only.includes(k));

  const browser = await chromium.launch();
  try {
    for (const [key, size] of sizes) {
      const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });
      const url = base + route;
      await page.goto(url, { waitUntil: "networkidle" });
      // Sections wrapped in <Reveal> only appear once an IntersectionObserver fires. A fullPage screenshot never
      // scrolls, so those sections stay at opacity 0 and the still shows a page that looks half-empty and broken
      // — the home board lost ~1900px of real content this way. Scroll the page through, then return to the top.
      if (key !== "sm") {
        await page.evaluate(async () => {
          const step = window.innerHeight * 0.8;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        });
      }
      // SETTLE **AFTER** the scroll-through, never before. An IO-gated choreography (the landing's LoopStage)
      // only MOUNTS when the scroll reaches it, and then needs autoplay + timeline (~3.7s) to reach its resting
      // frame. Settling first and shooting 400ms after the scroll photographed the market MID-STORY — the
      // pre-goal frame (CAN 0–0, 41.0) that a visitor sees for barely a second — while the copy beside it read
      // 61.4. That is the "verified" still that ships a contradiction. The resting state is the only honest shot.
      if (settle) await page.waitForTimeout(settle);
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
