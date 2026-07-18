// FIFA 3-letter → ISO 3166-1 alpha-2 (flag slug). Real flag images beat emoji: they render identically on
// every OS (Windows Chrome ships no flag-emoji font) and read as crisp crest discs.
// Flags are baked locally into public/flags/ by scripts/bake-flags.mjs — no runtime CDN dependency.
// Covers all 48 WC26 teams (src/data/wc26/teams.json) plus earlier fixture teams.
const FIFA_TO_ISO: Record<string, string> = {
  CAN: "ca", MAR: "ma", ESP: "es", JPN: "jp", ARG: "ar", MEX: "mx", USA: "us",
  ENG: "gb-eng", SCO: "gb-sct", WAL: "gb-wls", SEN: "sn", GER: "de", COL: "co",
  BRA: "br", PAR: "py", FRA: "fr", AUS: "au", EGY: "eg", CRO: "hr", NOR: "no",
  SUI: "ch", BEL: "be", POR: "pt", NED: "nl", ITA: "it", URU: "uy", NGA: "ng",
  KOR: "kr", GHA: "gh", SRB: "rs", DEN: "dk", SWE: "se", POL: "pl", UKR: "ua",
  CPV: "cv", KSA: "sa", ECU: "ec", CRC: "cr", TUN: "tn", CMR: "cm", QAT: "qa",
  IRN: "ir", AUT: "at", TUR: "tr", HUN: "hu", CZE: "cz", SVK: "sk",
  RSA: "za", BIH: "ba", HAI: "ht", CUW: "cw", CIV: "ci", NZL: "nz",
  IRQ: "iq", ALG: "dz", JOR: "jo", COD: "cd", UZB: "uz", PAN: "pa",
};

/** ISO flag slug for a FIFA code, or null if unmapped. Throws in dev so a missing team can't regress silently. */
export function iso2(fifaCode: string): string | null {
  const cc = FIFA_TO_ISO[fifaCode.toUpperCase()] ?? null;
  if (!cc && process.env.NODE_ENV !== "production") {
    throw new Error(`flags: unmapped FIFA code "${fifaCode}" — add it to FIFA_TO_ISO in src/lib/flags.ts`);
  }
  return cc;
}

/** Non-throwing membership check — true when a baked flag exists for this FIFA code. Use to decide whether to
 *  render <Flag> vs a neutral disc for provider data whose codes we may not cover (never crashes in dev). */
export const hasFlag = (fifaCode: string): boolean => fifaCode.toUpperCase() in FIFA_TO_ISO;

/** Local baked flag PNG (4:3) at a given render width. w80/w160 are the retina steps baked by bake-flags.mjs. */
export function flagUrl(fifaCode: string, w: 80 | 160 = 80): string | null {
  const cc = iso2(fifaCode);
  return cc ? `/flags/w${w}/${cc}.png` : null;
}
