// One-time bake: Natural Earth 110m land → equirectangular 1024×512 land-mask PNG (ADR-055: no runtime CDN).
import { chromium } from "playwright";
import { writeFileSync, statSync } from "node:fs";

const b = await chromium.launch();
const p = await b.newPage();
const geo = await p.evaluate(async () => {
  const r = await fetch("https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json");
  if (!r.ok) throw new Error("HTTP " + r.status);
  return await r.json();
});
const png = await p.evaluate((land) => {
  const W = 1024, H = 512;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  const px = (lng) => ((lng + 180) / 360) * W;
  const py = (lat) => ((90 - lat) / 180) * H;
  const drawRing = (ring) => {
    ctx.moveTo(px(ring[0][0]), py(ring[0][1]));
    for (let i = 1; i < ring.length; i++) ctx.lineTo(px(ring[i][0]), py(ring[i][1]));
    ctx.closePath();
  };
  ctx.beginPath();
  for (const f of land.features) {
    const g = f.geometry;
    if (g.type === "Polygon") drawRing(g.coordinates[0]);
    else if (g.type === "MultiPolygon") for (const poly of g.coordinates) drawRing(poly[0]);
  }
  ctx.fill();
  return c.toDataURL("image/png");
}, geo);
const out = process.argv[2];
writeFileSync(out, Buffer.from(png.split(",")[1], "base64"));
console.log("baked", out, statSync(out).size, "bytes");
await b.close();
