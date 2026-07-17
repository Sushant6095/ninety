// One-off: screenshot the Swagger UI at :4000/docs — the full tag-grouped list + one expanded endpoint (POST /orders).
// Proof for the backend audit. Run: node scripts/ui/docs-shot.mjs
import { chromium } from "playwright";

const OUT = process.env.OUT ?? "design/screens/impl";
const URL = process.env.DOCS_URL ?? "http://localhost:4000/docs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 2200 } });
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector(".opblock-summary, .opblock-tag", { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/swagger-docs-full.png`, fullPage: true });
console.log(`✓ full list → ${OUT}/swagger-docs-full.png`);

// Expand POST /orders to show request body + response schemas + Authorize.
const post = page.locator(".opblock.opblock-post").filter({ hasText: "/orders" }).first();
await post.locator(".opblock-summary").click();
await page.waitForTimeout(1200);
await post.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/swagger-docs-expanded.png`, fullPage: false });
console.log(`✓ expanded POST /orders → ${OUT}/swagger-docs-expanded.png`);

await browser.close();
