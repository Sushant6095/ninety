import Image from "next/image";
import { flagUrl } from "../../lib/flags";

interface FlagProps {
  code: string; // FIFA 3-letter
  size?: number; // disc diameter, px
  className?: string;
}

/** Real country flag as a circular crest disc, served from locally baked PNGs (public/flags/ — zero network).
 *  next/image with explicit dimensions; priority on large crests (featured panel + header) so they paint first. */
export function Flag({ code, size = 20, className = "" }: FlagProps) {
  const src = flagUrl(code, size > 28 ? 160 : 80);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-hairline/60 ring-1 ring-inset ring-hairline/80 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={code} width={size} height={size} priority={size > 28} className="h-full w-full object-cover" />
      ) : (
        <span className="num text-label font-semibold text-lo">{code.slice(0, 2)}</span>
      )}
    </span>
  );
}
