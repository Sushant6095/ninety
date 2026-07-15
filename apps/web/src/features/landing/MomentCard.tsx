"use client";
import { HolographicCard } from "../../components/vendor/godui/holographic-card";
import { MOMENTS, rarityOf, swingOf, RARITY_STYLE } from "../../lib/moments";

// The Moment-of-the-tournament teaser (godui holographic-card, re-skinned) — the close section's
// left-margin accent, mirroring the sticker on the right. Content is the CANONICAL Ashour moment
// from lib/moments (SSOT — no invented facts; AUS–EGY is not the live featured match, so nothing
// on this card can disagree with the hero tape). Foil is hi/up only: the card shows no on-chain
// element, so chain violet stays off it (rarityOf keeps it honest — a 24pt swing is Epic → up).
// Pointer-tilt is desktop-hover-only and max 6°; touch/reduced motion get the static card.

const MOMENT = MOMENTS[0]!; // "Ashour's counter" — the 74' money-shot

export function MomentCard({ className = "" }: { className?: string }) {
  const rarity = rarityOf(MOMENT);
  const swing = swingOf(MOMENT);
  return (
    <HolographicCard className={`w-[250px] p-5 text-left ${className}`}>
      <p className="text-label font-semibold uppercase tracking-caps text-lo">
        Moment of the tournament
      </p>
      <h3 className="mt-3 font-display text-heading font-semibold text-hi">{MOMENT.title}</h3>
      <p className="num mt-1 text-caption text-lo">
        {MOMENT.homeCode}–{MOMENT.awayCode} · {MOMENT.minute}&#39; · {MOMENT.pick} to win
      </p>
      <p className="num mt-4 text-display font-bold text-hi">
        {MOMENT.fromPrice.toFixed(1)}
        <span aria-hidden className="px-1.5 text-lo">
          →
        </span>
        {MOMENT.toPrice.toFixed(1)}
      </p>
      <p className="mt-4 flex items-center justify-between">
        <span
          className={`num rounded-chip px-2 py-0.5 text-label font-semibold uppercase tracking-caps ring-1 ring-inset ${RARITY_STYLE[rarity]}`}
        >
          {rarity}
        </span>
        <span className="num text-caption font-semibold text-up">+{swing.toFixed(1)}</span>
      </p>
    </HolographicCard>
  );
}
