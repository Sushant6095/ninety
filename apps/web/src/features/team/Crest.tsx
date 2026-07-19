import Image from "next/image";
import { TeamCrest } from "../../components/ui/TeamCrest";
import { hasFlag } from "../../lib/flags";

/** A baked local club crest (public/crests/{id}.{ext}, ADR-055 — no runtime CDN). next/image `unoptimized` so png
 *  AND svg render without the optimizer's SVG gate; it's a local static asset, so there's nothing to optimize. */
export function ClubCrest({ src, name, size = 96, priority = false }: { src: string; name: string; size?: number; priority?: boolean }) {
  return (
    <Image src={src} alt={`${name} crest`} width={size} height={size} priority={priority} unoptimized className="object-contain" style={{ width: size, height: size }} />
  );
}

/** Crest for a match/standings side. Renders a baked WC26 flag/crest when the code is one we bake, a baked local
 *  club crest when given one, otherwise a neutral token disc with the code — never a runtime-CDN crest (ADR-055),
 *  never a dev throw on an unmapped code (iso2 throws in dev; hasFlag is the safe gate). */
export function SideCrest({ code, size = 18, localCrest, name }: { code: string | null; size?: number; localCrest?: string | null; name?: string }) {
  if (localCrest) return <ClubCrest src={localCrest} name={name ?? code ?? "team"} size={size} />;
  if (code && hasFlag(code)) return <TeamCrest code={code} size={size} />;
  return (
    <span
      className="num inline-flex shrink-0 items-center justify-center rounded-full bg-hairline/50 text-label font-semibold text-lo ring-1 ring-inset ring-hairline/70"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {(code ?? "?").slice(0, 3)}
    </span>
  );
}
