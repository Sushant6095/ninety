// One-time bake: the play-money sticker PNG (512×512) for the landing StickerPeel.
// Asset bake — token hex lives here the same way it does in tokens.css (the sanctioned home).
import { chromium } from "playwright";
import { statSync } from "node:fs";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="244" fill="#14171C" stroke="#2BD97C" stroke-width="14"/>
  <circle cx="256" cy="256" r="206" fill="none" stroke="#232A33" stroke-width="2"/>
  <text x="256" y="196" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="64" fill="#F5F7FA" letter-spacing="-2">Ninety</text>
  <text x="256" y="264" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="40" fill="#2BD97C" letter-spacing="6">PLAY</text>
  <text x="256" y="312" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-weight="700" font-size="40" fill="#2BD97C" letter-spacing="6">MONEY</text>
  <text x="256" y="368" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="21" fill="#97A0AF" letter-spacing="2">NO CASH VALUE · EVER</text>
  <text x="256" y="408" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="19" fill="#97A0AF" letter-spacing="4">WC26</text>
</svg>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 512, height: 512 } });
await p.setContent(`<body style="margin:0">${SVG}</body>`);
const el = await p.$("svg");
const out = process.argv[2];
await el.screenshot({ path: out, omitBackground: true });
console.log("baked", out, statSync(out).size, "bytes");
await b.close();
