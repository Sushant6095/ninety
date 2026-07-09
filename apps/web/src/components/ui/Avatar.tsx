interface AvatarProps {
  handle: string;
  size?: number; // px
  className?: string;
}

/** Real photo avatar (deterministic per handle via pravatar seed) over an initials fallback that shows while
 *  loading or if the image fails. Plain <img> — external CDN, no optimization needed. */
export function Avatar({ handle, size = 32, className = "" }: AvatarProps) {
  const seed = encodeURIComponent(handle.replace(/^@/, "").toLowerCase());
  const initials = handle.replace(/^@/, "").slice(0, 2).toUpperCase();
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-hairline/60 ring-1 ring-inset ring-hairline ${className}`}
      style={{ width: size, height: size }}
    >
      <span aria-hidden className="num absolute inset-0 grid place-items-center font-semibold text-lo" style={{ fontSize: Math.round(size * 0.34) }}>
        {initials}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`https://i.pravatar.cc/${size * 2}?u=${seed}`} alt="" width={size} height={size} loading="lazy" decoding="async" className="relative h-full w-full object-cover" />
    </span>
  );
}
