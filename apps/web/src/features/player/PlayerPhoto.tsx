import Image from "next/image";
import { TeamCrest } from "../../components/ui/TeamCrest";

interface PlayerPhotoProps {
  name: string;
  photo: string | null; // baked-local path, or null → initials
  nat: string; // FIFA code — small crest badge
  size?: number;
  priority?: boolean;
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** The player disc — a baked-local photo when Session B captured one, else initials in a token disc. No runtime
 *  CDN (ADR-055) and no redistributed provider photo: the 13/20 without a baked shot get a clean initials avatar.
 *  A nation crest badge sits bottom-right, mirroring the reference. */
export function PlayerPhoto({ name, photo, nat, size = 96, priority = false }: PlayerPhotoProps) {
  const badge = Math.round(size * 0.34);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-hairline/40 ring-1 ring-inset ring-hairline"
        style={{ width: size, height: size }}
      >
        {photo ? (
          <Image src={photo} alt={name} width={size} height={size} priority={priority} className="h-full w-full object-cover object-top" />
        ) : (
          <span aria-hidden className="num font-semibold text-lo" style={{ fontSize: Math.round(size * 0.3) }}>
            {initialsOf(name)}
          </span>
        )}
      </span>
      <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-bg ring-2 ring-bg" style={{ width: badge, height: badge }}>
        <TeamCrest code={nat} size={Math.round(badge * 0.82)} />
      </span>
    </span>
  );
}
