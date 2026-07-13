// Halt money-shot capture for the ui-craft loop (Gate A). Records the /terminal autoplay sequence
// as a video, then uses the "Replay the halt" button for deterministic timed stills of each beat.
// Usage: UI_URL=http://localhost:3001 node scripts/ui/capture-halt.mjs
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.UI_URL || "http://localhost:3000";
const IMPL = path.join(process.cwd(), "design/screens/impl");
const VIDDIR = process.env.VIDDIR || path.join(IMPL, "halt-video");
const VP = { width: Number(process.env.W || 1440), height: Number(process.env.H || 900) };
const TAG = process.env.TAG || "xl";

await mkdir(IMPL, { recursive: true });
await mkdir(VIDDIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VP, recordVideo: { dir: VIDDIR, size: VP } });
const page = await ctx.newPage();
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));

await page.goto(`${BASE}/terminal`, { waitUntil: "domcontentloaded" });
await page.getByText("Momentum River", { exact: false }).first().waitFor({ timeout: 20000 });

// 1) initial autoplay money-shot — the video records it
await page.waitForTimeout(7000);
await page.screenshot({ path: `${IMPL}/terminal-settled.${TAG}.png` });

// 2) deterministic replay → timed stills of each beat
const replay = page.getByRole("button", { name: /replay/i });
if (await replay.count()) {
  await replay.first().click();
  const beats = [[250, "sweep"], [560, "freeze"], [1050, "cliff"], [1500, "booth"], [2700, "resume"]];
  let last = 0;
  for (const [t, name] of beats) {
    await page.waitForTimeout(t - last); last = t;
    await page.screenshot({ path: `${IMPL}/terminal-halt-${name}.${TAG}.png` });
  }
} else {
  console.log("NO REPLAY BUTTON FOUND");
}

await ctx.close();
await browser.close();
console.log("console errors:", errs.length ? JSON.stringify(errs.slice(0, 12), null, 2) : "none");
console.log("done");
