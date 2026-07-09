// FIFA 3-letter → ISO 3166-1 alpha-2 (flagcdn slug). Real flag images beat emoji: they render identically on
// every OS (Windows Chrome ships no flag-emoji font) and read as crisp crest discs. Add codes as fixtures grow.
const FIFA_TO_ISO: Record<string, string> = {
  CAN: "ca", MAR: "ma", ESP: "es", JPN: "jp", ARG: "ar", MEX: "mx", USA: "us",
  ENG: "gb-eng", SCO: "gb-sct", WAL: "gb-wls", SEN: "sn", GER: "de", COL: "co",
  BRA: "br", PAR: "py", FRA: "fr", AUS: "au", EGY: "eg", CRO: "hr", NOR: "no",
  SUI: "ch", BEL: "be", POR: "pt", NED: "nl", ITA: "it", URU: "uy", NGA: "ng",
  KOR: "kr", GHA: "gh", SRB: "rs", DEN: "dk", SWE: "se", POL: "pl", UKR: "ua",
};

/** flagcdn slug for a FIFA code, or null if unmapped. */
export function iso2(fifaCode: string): string | null {
  return FIFA_TO_ISO[fifaCode.toUpperCase()] ?? null;
}

/** flagcdn PNG url at a given render width (they serve 4:3 PNGs; w40/w80/w160 are retina steps). */
export function flagUrl(fifaCode: string, w: 40 | 80 | 160 = 80): string | null {
  const cc = iso2(fifaCode);
  return cc ? `https://flagcdn.com/w${w}/${cc}.png` : null;
}
