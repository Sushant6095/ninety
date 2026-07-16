// The blank-River regression gate (flag 5): the hero's lightweight-charts canvas must be SIZED —
// an unsized chart paints a default 300px-wide canvas and ships as a void. Asserts on the live page.
//   run: UI_URL=http://localhost:3002 node scripts/assert-river.mjs
import { chromium } from "playwright";

const base = process.env.UI_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 960 } });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
// Only VISIBLE canvases gate the ship: charts mounted inside display:none mobile variants measure
// 0 → lightweight-charts defaults them to 300×150, but they never paint. (That hidden mounting is a
// known pre-existing inefficiency — verified identical on prod — tracked separately, not this gate.)
const canvases = await page.evaluate(() =>
  [...document.querySelectorAll("canvas")].map((c) => {
    const r = c.getBoundingClientRect();
    const visible = !!c.offsetParent || (r.width > 0 && r.height > 0 && getComputedStyle(c).visibility !== "hidden");
    return { w: c.width, h: c.height, visible, cls: c.className.slice(0, 40) };
  }),
);
await browser.close();
const visible = canvases.filter((c) => c.visible);
console.log(`canvases on /: ${canvases.length} total, ${visible.length} visible`);
if (visible.length === 0) {
  console.error("FAIL: no visible canvas on the landing — the River is missing");
  process.exit(1);
}
const voids = visible.filter((c) => c.w === 300 && c.h === 150);
if (voids.length > 0) {
  console.error("FAIL: a VISIBLE default-sized 300x150 canvas — an unsized chart shipped:", JSON.stringify(voids));
  process.exit(1);
}
console.log("PASS: every visible canvas is sized (hero River present, no 300x150 void)", JSON.stringify(visible.map((c) => `${c.w}x${c.h}`)));
