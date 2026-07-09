interface AvatarProps {
  handle: string;
  size?: number; // px
  className?: string;
}

/** Neutral monogram disc. Brand colors are semantic (up/down = price, chain = on-chain) so avatars stay
 *  neutral by design law; real user photos would slot in here once an image host + CSP allow-list exist. */
export function Avatar({ handle, size = 32, className = "" }: AvatarProps) {
  const initials = handle.replace(/^@/, "").slice(0, 2).toUpperCase();
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-hairline/50 font-semibold text-hi ring-1 ring-inset ring-hairline ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </span>
  );
}
