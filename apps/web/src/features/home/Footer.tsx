/** Play-money promise + system status. The play-money line is a hard product law (no cash payouts, ever). */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-5 text-label text-lo sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Ninety is a free-to-play game. Credits are play money and have no cash value.</p>
        <p className="num tracking-wide">LMSR PRICING · PROOFS ON SOLANA DEVNET · FEED 42 MS</p>
      </div>
    </footer>
  );
}
