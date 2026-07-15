/**
 * Shared per-identity disc palette (godui presence helper, re-skinned to Ninety).
 *
 * The stock ramp was eight raw oklch hues — off-token, and Ninety's semantic colors
 * (up/down/halt/chain) may never be spent decoratively on avatars. The re-skin keeps the
 * deterministic hash → stable-color contract but collapses the ramp to neutral steps
 * mixed from the token vars (--text-lo / --text-hi over --surface), matching the repo's
 * initials-disc idiom.
 */

/** The disc ramp — neutral steps built only from token vars. */
export const PRESENCE_COLORS = [
  "color-mix(in srgb, var(--text-lo) 30%, var(--surface))",
  "color-mix(in srgb, var(--text-lo) 22%, var(--surface))",
  "color-mix(in srgb, var(--text-hi) 14%, var(--surface))",
  "color-mix(in srgb, var(--text-lo) 38%, var(--surface))",
] as const;

/** Deterministic 32-bit hash of a string. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolve a stable disc color for an identity (id, name, email, …).
 * The same key always maps to the same color.
 */
export function presenceColor(key: string): string {
  return PRESENCE_COLORS[hashString(key) % PRESENCE_COLORS.length];
}

/** Two-letter initials from a display name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
