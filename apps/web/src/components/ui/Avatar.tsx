interface AvatarProps {
  handle: string;
  size?: number; // px
  className?: string;
}

// Deterministic identicon — initials in a token-tinted disc, seeded from the handle. NO network, NO third-party
// avatar CDN, NO photos of people who do not exist. The tint is picked from a fixed set of Ninety
// tokens by a stable hash of the handle, so a given user always gets the same colour, and it renders identically
// offline and in both themes. Classes are static (JIT-safe) — never string-built token names.
const VARIANTS = [
  "bg-up/15 text-up ring-up/40",
  "bg-chain/15 text-chain ring-chain/40",
  "bg-halt/15 text-halt ring-halt/40",
  "bg-down/15 text-down ring-down/40",
  "bg-hairline/60 text-hi ring-hairline",
] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ handle, size = 32, className = "" }: AvatarProps) {
  const key = handle.replace(/^@/, "");
  const initials = (key.slice(0, 2) || "··").toUpperCase();
  const variant = VARIANTS[hash(key.toLowerCase()) % VARIANTS.length];
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full ring-1 ring-inset ${variant} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="num font-semibold leading-none" style={{ fontSize: Math.round(size * 0.38) }}>
        {initials}
      </span>
    </span>
  );
}
