import { describe, it, expect } from "vitest";
import { pickSwingWindow, renderSwingCardSvg, buildMoment, type MarkSample, type MomentDeps } from "./swing-card";

const series: MarkSample[] = [
  { minute: 10, fair: { H: 0.5, D: 0.3, A: 0.2 } },
  { minute: 25, fair: { H: 0.55, D: 0.28, A: 0.17 } },
  { minute: 40, fair: { H: 0.45, D: 0.25, A: 0.3 } }, // A jumps 0.17 → 0.30 = +13pts, the biggest move
  { minute: 55, fair: { H: 0.48, D: 0.27, A: 0.25 } },
];

describe("pickSwingWindow", () => {
  it("finds the biggest time-ordered directional move across outcomes", () => {
    const w = pickSwingWindow(series);
    expect(w).not.toBeNull();
    expect(w!.outcome).toBe("A");
    expect(w!.from).toBe(17.0);
    expect(w!.to).toBe(30.0);
    expect(w!.delta).toBe(13.0); // signed rise, one decimal
    expect(w!.minuteFrom).toBe(25);
    expect(w!.minuteTo).toBe(40);
  });

  it("returns null for a flat/too-short series", () => {
    expect(pickSwingWindow([])).toBeNull();
    expect(pickSwingWindow([{ minute: 10, fair: { H: 0.5 } }])).toBeNull();
  });

  it("reports a fall as a negative delta", () => {
    const w = pickSwingWindow([
      { minute: 5, fair: { H: 0.7 } },
      { minute: 60, fair: { H: 0.3 } },
    ]);
    expect(w!.delta).toBe(-40.0);
    expect(w!.minuteFrom).toBe(5);
    expect(w!.minuteTo).toBe(60);
  });
});

describe("renderSwingCardSvg", () => {
  it("renders a token-palette SVG citing the delta + minute range in mono", () => {
    const svg = renderSwingCardSvg(series, pickSwingWindow(series)!, { home: "Brazil", away: "Spain", marketLabel: "WIN MARKET" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("+13.0"); // the delta
    expect(svg).toContain("25' → 40'"); // minute annotation
    expect(svg).toContain("17.0 → 30.0"); // from → to prices
    expect(svg).toContain("#2BD97C"); // --up (positive swing)
    expect(svg).toContain("IBM Plex Mono"); // mono numbers
    expect(svg).toContain("Brazil v Spain");
    expect(svg).toContain("<polyline"); // the river segment
  });

  it("uses the down color for a negative swing", () => {
    const down = pickSwingWindow([{ minute: 5, fair: { H: 0.7 } }, { minute: 60, fair: { H: 0.3 } }])!;
    const svg = renderSwingCardSvg([{ minute: 5, fair: { H: 0.7 } }, { minute: 60, fair: { H: 0.3 } }], down);
    expect(svg).toContain("#FF3D81"); // --down
    expect(svg).not.toContain("#2BD97C");
  });
});

describe("buildMoment", () => {
  function mockDeps(samples: MarkSample[]) {
    const uploads: Array<{ key: string; svg: string }> = [];
    const saved: Array<{ marketId: string; imageUri: string }> = [];
    const deps: MomentDeps = {
      getMatchMarks: async () => samples,
      uploadImage: async (key, svg) => (uploads.push({ key, svg }), `https://cdn.omnipitch.gg/${key}`),
      saveMoment: async (m) => void saved.push(m),
    };
    return { deps, uploads, saved };
  }

  it("produces exactly one moment whose window matches the data, uploaded + persisted once", async () => {
    const { deps, uploads, saved } = mockDeps(series);
    const row = await buildMoment("m1", deps);
    expect(row).not.toBeNull();
    expect(row!.win.outcome).toBe("A");
    expect(row!.win.delta).toBe(13.0);
    expect(row!.win.minuteTo).toBe(40);
    expect(uploads).toHaveLength(1);
    expect(uploads[0].key).toBe("moments/m1.svg");
    expect(uploads[0].svg).toContain("+13.0");
    expect(saved).toEqual([{ marketId: "m1", imageUri: "https://cdn.omnipitch.gg/moments/m1.svg" }]);
    expect(row!.imageUri).toBe("https://cdn.omnipitch.gg/moments/m1.svg");
  });

  it("no swing → no card, no upload, no row", async () => {
    const { deps, uploads, saved } = mockDeps([{ minute: 10, fair: { H: 0.5 } }]);
    const row = await buildMoment("m2", deps);
    expect(row).toBeNull();
    expect(uploads).toHaveLength(0);
    expect(saved).toHaveLength(0);
  });
});
