// Moment swing card. Per settled match: pick the biggest |Δmark| window, server-render a card (Momentum River
// segment + minute annotation, token palette, IBM Plex Mono numbers), upload it, and write a Moment row the gallery
// reads. Rendering is a self-contained SVG (the right primitive for this data-viz — no satori/canvas needed); a PNG
// rasterization step (resvg) is an optional last mile behind the uploader. All IO is injected (MomentDeps).

// Token palette (design/tokens.css) — the card must not hardcode raw hex elsewhere; these mirror the CSS vars.
const C = { bg: "#0B0D10", surface: "#14171C", hairline: "#232A33", textHi: "#F5F7FA", textLo: "#97A0AF", up: "#2BD97C", down: "#FF3D81" };
const MONO = "'IBM Plex Mono', ui-monospace, monospace"; // numbers are mono, tabular (CLAUDE.md)
const W = 800;
const H = 450;

export interface MarkSample {
  minute: number; // match minute the mark was observed at
  fair: Record<string, number>; // outcome → probability (0..1)
}

export interface SwingWindow {
  outcome: string;
  from: number; // price 0..100, one decimal
  to: number;
  delta: number; // signed to − from, one decimal
  minuteFrom: number;
  minuteTo: number;
}

const p1 = (fair: number): number => Math.round(fair * 1000) / 10; // fair → price 0..100, one decimal

/** The biggest time-ordered directional move (max rise or fall) across all outcomes over the whole match. O(n·outcomes). */
export function pickSwingWindow(samples: MarkSample[]): SwingWindow | null {
  if (samples.length < 2) return null;
  const outcomes = new Set<string>();
  for (const s of samples) for (const k of Object.keys(s.fair)) outcomes.add(k);
  let best: SwingWindow | null = null;
  let bestAbs = 0;
  for (const o of outcomes) {
    let minIdx = -1;
    let maxIdx = -1;
    for (let j = 0; j < samples.length; j++) {
      const v = samples[j].fair[o];
      if (v === undefined) continue;
      const consider = (i: number) => {
        const fromV = samples[i].fair[o];
        if (fromV === undefined) return;
        const abs = Math.abs(v - fromV);
        if (abs > bestAbs) {
          bestAbs = abs;
          best = { outcome: o, from: p1(fromV), to: p1(v), delta: Math.round((v - fromV) * 1000) / 10, minuteFrom: samples[i].minute, minuteTo: samples[j].minute };
        }
      };
      if (minIdx >= 0) consider(minIdx); // rise from the earlier minimum up to v
      if (maxIdx >= 0) consider(maxIdx); // fall from the earlier maximum down to v
      if (minIdx < 0 || v < (samples[minIdx].fair[o] as number)) minIdx = j;
      if (maxIdx < 0 || v > (samples[maxIdx].fair[o] as number)) maxIdx = j;
    }
  }
  return best;
}

const esc = (s: string): string => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] as string);
const signed1 = (n: number): string => (n >= 0 ? "+" : "") + n.toFixed(1);

export interface CardMeta {
  home?: string;
  away?: string;
  marketLabel?: string; // e.g. "WIN MARKET"
}

/** Render the swing card as a self-contained SVG string. Draws the outcome's price series, highlights the swing. */
export function renderSwingCardSvg(samples: MarkSample[], win: SwingWindow, meta: CardMeta = {}): string {
  const stroke = win.delta >= 0 ? C.up : C.down;
  const series = samples.map((s) => ({ m: s.minute, v: s.fair[win.outcome] })).filter((d): d is { m: number; v: number } => d.v !== undefined);
  const minM = Math.min(...series.map((d) => d.m));
  const maxM = Math.max(...series.map((d) => d.m)) || minM + 1;
  const padX = 48;
  const padTop = 210;
  const plotH = 160;
  const x = (m: number) => padX + ((m - minM) / (maxM - minM || 1)) * (W - 2 * padX);
  const y = (v: number) => padTop + plotH - v * plotH; // fair 0..1 → bottom..top
  const pts = series.map((d) => `${x(d.m).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const title = meta.home && meta.away ? `${esc(meta.home)} v ${esc(meta.away)}` : "Momentum swing";
  const label = esc(meta.marketLabel ?? win.outcome);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Swing card ${label} ${signed1(win.delta)} points at minute ${win.minuteTo}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="16" fill="${C.surface}" stroke="${C.hairline}" stroke-width="1"/>
  <text x="48" y="72" font-family="Archivo, sans-serif" font-size="26" font-weight="700" fill="${C.textHi}">${title}</text>
  <text x="48" y="104" font-family="Inter, sans-serif" font-size="16" fill="${C.textLo}">${label} · biggest swing</text>
  <text x="48" y="176" font-family="${MONO}" font-size="64" font-weight="700" fill="${stroke}" style="font-variant-numeric:tabular-nums">${signed1(win.delta)}</text>
  <text x="300" y="176" font-family="${MONO}" font-size="28" fill="${C.textLo}" style="font-variant-numeric:tabular-nums">${win.from.toFixed(1)} → ${win.to.toFixed(1)}</text>
  <polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="${x(win.minuteTo).toFixed(1)}" y="${(padTop + plotH + 28).toFixed(1)}" font-family="${MONO}" font-size="18" fill="${C.textHi}" text-anchor="middle" style="font-variant-numeric:tabular-nums">${win.minuteFrom}' → ${win.minuteTo}'</text>
</svg>`;
}

// --- orchestration (injected IO) ---

export interface MomentRow {
  marketId: string;
  imageUri: string;
  win: SwingWindow;
}

export interface MomentDeps {
  getMatchMarks(marketId: string): Promise<MarkSample[]>; // prod: a Redis per-match mark series; test: a fixture
  uploadImage(key: string, svg: string): Promise<string>; // prod: R2 (env-gated); returns the public URL
  saveMoment(m: { marketId: string; imageUri: string }): Promise<void>; // prod: Prisma Moment row
  getMeta?(marketId: string): Promise<CardMeta>;
}

/** Build the one moment for a settled match: pick the swing → render → upload → persist. null on a flat match. */
export async function buildMoment(marketId: string, deps: MomentDeps): Promise<MomentRow | null> {
  const samples = await deps.getMatchMarks(marketId);
  const win = pickSwingWindow(samples);
  if (!win) return null; // no meaningful swing → no card
  const meta = (await deps.getMeta?.(marketId)) ?? {};
  const svg = renderSwingCardSvg(samples, win, meta);
  const imageUri = await deps.uploadImage(`moments/${marketId}.svg`, svg);
  await deps.saveMoment({ marketId, imageUri });
  return { marketId, imageUri, win };
}
