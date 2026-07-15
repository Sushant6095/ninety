import Image from "next/image";
import { crestByCode } from "../../lib/teamMedia";
import { Flag } from "./Flag";

interface TeamCrestProps {
  code: string; // FIFA 3-letter
  size?: number; // box edge, px
  className?: string;
  priority?: boolean; // hero crests (featured / match header) paint first
}

/** Real national-team crest, baked from TheSportsDB into public/teams/ (zero network). A crest is its own
 *  emblem shape, so it renders free-standing (object-contain), not cropped into a disc. Falls back to the
 *  circular Flag disc for any team without a baked crest, so it is a safe drop-in replacement for <Flag>. */
export function TeamCrest({ code, size = 20, className = "", priority = false }: TeamCrestProps) {
  const src = crestByCode(code);
  if (!src) return <Flag code={code} size={size} className={className} />;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Image src={src} alt={`${code} crest`} width={size} height={size} priority={priority} className="h-full w-full object-contain" />
    </span>
  );
}
