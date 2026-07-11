import { flagUrl } from "../../lib/flags";

interface FlagProps {
  code: string; // FIFA 3-letter
  size?: number; // disc diameter, px
  className?: string;
}

/** Real country flag as a circular crest disc (flagcdn PNG). Falls back to a neutral disc when unmapped.
 *  Plain <img> on purpose — external CDN, tiny, no optimization needed, guaranteed cross-platform render. */
export function Flag({ code, size = 20, className = "" }: FlagProps) {
  const src = flagUrl(code, size > 28 ? 160 : 80);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-hairline/60 ring-1 ring-inset ring-hairline/80 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // impeccable-disable broken-image -- src is a runtime flagcdn URL; renders a real flag PNG, not a placeholder
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={code} width={size} height={size} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : (
        <span className="num text-label font-semibold text-lo">{code.slice(0, 2)}</span>
      )}
    </span>
  );
}
