"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { buttonVariants } from "src/components/ui/button";
import { HeroRiver } from "src/features/landing/HeroRiver";

// notio's two-column hero, re-skinned to Ninety: left is our copy + CTAs, right is the live Momentum
// River (our signature) in place of notio's <Transcriber/>. Background is the re-skinned dark green dome.
export default function Hero() {
  return (
    <div className="mx-2 md:mx-4 lg:mx-6 mt-24">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative isolate flex flex-col gap-12 lg:gap-8 min-[1070px]:flex-row items-center min-[1070px]:justify-between lg:w-[95dvw] mx-auto pt-12 px-4 md:px-12 lg:pl-12 xl:pl-20 min-h-[38rem] lg:min-h-[44rem] overflow-hidden rounded-4xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 -z-10 bg-hero-radial-dark"
        />
        <section className="flex flex-col gap-5 z-10 text-center min-[1070px]:text-left items-center min-[1070px]:items-start max-w-xl">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="num inline-flex items-center gap-2 rounded-chip border border-hairline bg-surface/70 px-3 py-1 text-label font-semibold uppercase tracking-caps text-lo"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-up shadow-[0_0_6px_var(--up)]" />
            World Cup 2026 · live
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="font-aleo font-bold tracking-tight text-hi text-4xl md:text-[2.9rem] xl:text-6xl leading-[1.03]"
          >
            Every match is a market for ninety minutes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-base leading-relaxed max-w-lg text-lo"
          >
            A free-to-play live football exchange. Prices move with the game, the Booth explains
            the swings, and Solana proves the result. Play money — 1,000 credits a match, no
            deposits, ever.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
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
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[34rem] min-[1070px]:w-[32rem] xl:w-[36rem] rounded-4xl border border-hairline bg-surface/80 p-5 elev-hi"
        >
          <HeroRiver />
        </motion.section>
      </motion.div>
    </div>
  );
}
