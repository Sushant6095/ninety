// CONNECT (Phase 2) — the Moments data source. getMomentList()/getMomentDetail() return the Moment shape the
// gallery + share card render, from baked fixtures (NEXT_PUBLIC_USE_FIXTURES=1, offline demo) or from GET /moments
// (live), mapping the API's MomentView → Moment. Server-safe (no hooks) so the detail server page can await it.
//
// Honest degrade: the live /moments is currently EMPTY (nothing minted/seeded), so a live list is []. We render an
// empty state — we NEVER fabricate a moment, and never dress the fixtures up as live (fixtures are the offline path
// only). MomentView carries only id/matchId/teams/imageUri/swing/mintSig; the fields it can't give (title, owner,
// pick, minute, absolute prices, the river slice) are left neutral/derived, never invented.
import { getMoments, getMoment, type MomentView } from "../api";
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

/** The Moments gallery list — the LIVE path, kept for CONNECT Phase 2 (un-pin `getMomentList` to this once the
 *  feed actually mints/seeds moments). Live GET /moments is empty today, so this returns []. */
export async function getMomentListLive(matchId?: string): Promise<Moment[]> {
  const { moments } = await getMoments(matchId);
  return moments.map(toMoment);
}

/** The Moments gallery list. PINNED to fixtures, EXACTLY like `getBoardMarkets` (CONNECT Phase 2 decision):
 *  this is a fixture-driven demo — the board pins its markets and headlines a "Moment of the day · minted by
 *  @hexfan", so an empty Moments gallery both contradicts the board (a minted moment referenced there, "No
 *  moments yet" here) AND leaves the app's most emotional surface a cold void. The MOMENTS are real baked
 *  fixtures (real teams, real swings), not fabricated live data, and each keeps its honest `mintSig: null` →
 *  the cards render "mintless", never a fake mint. Un-pin (return getMomentListLive()) once real minting lands. */
export async function getMomentList(_matchId?: string): Promise<Moment[]> {
  return MOMENTS;
}

/** One moment for the share card — the LIVE path, kept for CONNECT Phase 2. null on 404 / network. */
export async function getMomentDetailLive(id: string): Promise<Moment | null> {
  try {
    const { moment } = await getMoment(id);
    return toMoment(moment);
  } catch {
    return null; // api() throws on non-2xx (incl. 404) — treat as not found
  }
}

/** One moment for the share card. PINNED to fixtures alongside `getMomentList` (same CONNECT decision): the
 *  gallery lists MOMENTS, so every card MUST resolve to its detail — a live (empty) detail path would 404 every
 *  moment the gallery just showed. An id not in the fixtures still returns null → a real 404 (never a silent
 *  fall-back to another moment). Un-pin (return getMomentDetailLive(id)) once real minting lands. */
export async function getMomentDetail(id: string): Promise<Moment | null> {
  return momentById(id) ?? null;
}
