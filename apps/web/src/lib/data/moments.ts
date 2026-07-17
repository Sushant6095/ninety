// CONNECT (Phase 2) — the Moments data source. getMomentList()/getMomentDetail() return the Moment shape the
// gallery + share card render, from baked fixtures (NEXT_PUBLIC_USE_FIXTURES=1, offline demo) or from GET /moments
// (live), mapping the API's MomentView → Moment. Server-safe (no hooks) so the detail server page can await it.
//
// Honest degrade: the live /moments is currently EMPTY (nothing minted/seeded), so a live list is []. We render an
// empty state — we NEVER fabricate a moment, and never dress the fixtures up as live (fixtures are the offline path
// only). MomentView carries only id/matchId/teams/imageUri/swing/mintSig; the fields it can't give (title, owner,
// pick, minute, absolute prices, the river slice) are left neutral/derived, never invented.
import { getMoments, getMoment, USE_FIXTURES, type MomentView } from "../api";
import { MOMENTS, momentById, type Moment } from "../moments";
import { deriveCode } from "./markets";

export { MOMENTS } from "../moments";

/** MomentView (API) → Moment (UI). `swing` is the one real magnitude the API gives; it drives rarity + the river
 *  slice off a 0 baseline (the absolute from/to prices aren't in the payload). Unknowns stay neutral — no fake
 *  owner, pick, or minute that would read as real data. */
export function toMoment(v: MomentView): Moment {
  const swing = v.swing ?? 0;
  const homeCode = deriveCode(v.home);
  const awayCode = deriveCode(v.away);
  return {
    id: v.id,
    matchId: v.matchId,
    homeCode,
    awayCode,
    title: `${homeCode} v ${awayCode}`, // API has no title — derive from the teams, don't invent copy
    outcome: "H", // API has no per-outcome tag; neutral default (not surfaced in the UI)
    pick: "", // unknown — never a fabricated pick
    minute: 0, // unknown — neutral
    fromPrice: 0, // absolute baseline isn't in the payload; swing is the real datum → 0 → swing
    toPrice: swing,
    owner: "", // unknown — never a fabricated owner
    ts: v.createdAt,
    mintSig: v.mintSig, // the ONLY chain surface; null = mintless
    segment: [0, swing], // minimal river derived from the real swing — no fabricated curve
  };
}

/** The Moments gallery list. Fixtures offline; live GET /moments (empty today → []) otherwise. */
export async function getMomentList(matchId?: string): Promise<Moment[]> {
  if (USE_FIXTURES) return MOMENTS;
  const { moments } = await getMoments(matchId);
  return moments.map(toMoment);
}

/** One moment for the share card. Fixtures offline; live GET /moments/:id otherwise. null on 404 / network. */
export async function getMomentDetail(id: string): Promise<Moment | null> {
  if (USE_FIXTURES) return momentById(id) ?? null;
  try {
    const { moment } = await getMoment(id);
    return toMoment(moment);
  } catch {
    return null; // api() throws on non-2xx (incl. 404) — treat as not found
  }
}
