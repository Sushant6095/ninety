/** Play-money promise + system status + data credits. The play-money line is a hard product law
 *  (no cash payouts, ever). TxLINE owns the live/settlement data; worldcup26 (ISC) the static context. */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-2 text-label text-lo sm:flex-row sm:items-center sm:justify-between">
          <p>Ninety is a free-to-play game. Credits are play money and have no cash value.</p>
          <p className="num tracking-wide">LMSR PRICING · PROOFS ON SOLANA DEVNET</p>
        </div>
        <p className="mt-3 border-t border-hairline/60 pt-3 text-label text-lo">
          Priced by TxLINE · World Cup context from{" "}
          <a
            href="https://github.com/rezarahiminia/worldcup2026"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 transition-opacity duration-200 hover:opacity-80 hover:underline"
          >
            worldcup26
          </a>{" "}
          (ISC)
        </p>
      </div>
    </footer>
  );
}
