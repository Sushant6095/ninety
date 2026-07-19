"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { buttonVariants } from "src/components/ui/button";
import { HeroRiver } from "src/features/landing/HeroRiver";
import { HeroGradientField } from "src/features/landing/HeroGradientField";

// BEAT 2 (the product resolves in). The cinematic frame-scrub above is beat 1 and carries the thesis
// ("Every match is a market for ninety minutes"); this beat must NOT repeat it, or the two heroes compete and
// the page reads flat. So it leads with the live Momentum River (our signature) and one action line. Smaller
// display type than beat 1 by design. Background is the sanctioned animated gradient field (ADR-058).
export default function Hero() {
  return (
    <div className="mx-2 md:mx-4 lg:mx-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative isolate flex flex-col gap-10 lg:gap-8 min-[1070px]:flex-row items-center min-[1070px]:justify-between lg:w-[95dvw] mx-auto py-16 px-4 md:px-12 lg:pl-12 xl:pl-20 lg:py-24 overflow-hidden rounded-4xl border border-hairline"
      >
        <HeroGradientField />
        <section className="flex flex-col gap-5 z-10 text-center min-[1070px]:text-left items-center min-[1070px]:items-start max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="font-display font-bold tracking-tight text-hi text-3xl md:text-4xl xl:text-5xl leading-[1.05]"
          >
            Trade every minute of the match
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-base leading-relaxed max-w-lg text-lo"
          >
            A free-to-play live football exchange. Prices move with the game, the Booth explains
            the swings, and Solana proves the result. Play money, 1,000 credits a match, no
            deposits, ever.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center min-[1070px]:justify-start gap-3"
          >
            <Link href="/terminal" className={buttonVariants({ size: "lg" })}>
              Open the terminal
            </Link>
            <Link
              href="/how-it-works"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              How it works
            </Link>
          </motion.div>
        </section>
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[34rem] min-[1070px]:w-[32rem] xl:w-[36rem] rounded-4xl border border-hairline bg-surface/80 p-5 elev-hi"
        >
          <HeroRiver />
        </motion.section>
      </motion.div>
    </div>
  );
}
