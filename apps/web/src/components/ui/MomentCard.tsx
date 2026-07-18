import Link from "next/link";
import { TeamCrest } from "./TeamCrest";
import { Avatar } from "./Avatar";
import { EquityCurve } from "./EquityCurve";
import { routes } from "../../lib/routes";
import { fmtPrice, signedCR } from "../../lib/format";
import { rarityOf, swingOf, RARITY_STYLE, type Moment } from "../../lib/moments";

/** A captured swing — rarity by swing size, annotated river slice, owner, and (if minted) the violet chain badge.
 *  Reused on the Moments gallery and the Profile moments shelf. Whole card links to the share detail. */
export function MomentCard({ m }: { m: Moment }) {
  const rarity = rarityOf(m);
  const swing = swingOf(m);
  const up = swing >= 0;
  return (
    <Link
      href={routes.moment(m.id)}
      aria-label={`${m.title} — ${rarity} moment, ${m.pick} ${fmtPrice(m.fromPrice)} to ${fmtPrice(m.toPrice)}`}
      className="group elev block overflow-hidden rounded-card border border-hairline bg-surface p-4 outline-none transition-colors duration-200 hover:border-hairline hover:bg-hairline/10 focus-visible:bg-hairline/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50"
    >
      <div className="flex items-center justify-between">
        <span className={`rounded-chip px-2 py-0.5 text-label font-semibold uppercase tracking-micro ring-1 ring-inset ${RARITY_STYLE[rarity]}`}>{rarity}</span>
        <span className="num text-label font-semibold tabular-nums text-lo">{m.minute}&#39;</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <TeamCrest code={m.homeCode} size={18} />
        <TeamCrest code={m.awayCode} size={18} />
        <span className="num text-caption tabular-nums text-lo">{m.homeCode} v {m.awayCode}</span>
      </div>
      <h3 className="mt-1 text-strong font-semibold leading-snug text-hi">{m.title}</h3>

      <div className="mt-3">
        <EquityCurve values={m.segment} up={up} height={52} />
      </div>
      <div className="num mt-2 text-caption tabular-nums text-lo">
        {m.pick} {fmtPrice(m.fromPrice)} → <span className="text-hi">{fmtPrice(m.toPrice)}</span>
        <span className={`ml-2 font-medium ${up ? "text-up" : "text-down"}`}>{signedCR(swing)}</span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar handle={m.owner} size={20} />
          <span className="truncate text-caption text-lo">{m.owner}</span>
        </span>
        {m.mintSig ? (
          <span className="inline-flex items-center gap-1.5 text-label font-medium text-chain" title="Minted on Solana devnet">
            <span className="h-1.5 w-1.5 rounded-full bg-chain" />
            Minted
          </span>
        ) : (
          <span className="text-label font-medium uppercase tracking-wide text-lo">mintless</span>
        )}
      </div>
    </Link>
  );
}
