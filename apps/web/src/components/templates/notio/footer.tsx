"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Wordmark } from "src/components/ui/Wordmark";
import { buttonVariants } from "src/components/ui/button";

// notio's radial-CTA footer, re-skinned to Ninety: our closing line + terminal CTA over the (bridged)
// violet dome, our Wordmark and real links, and the play-money footer line. Dropped notio's social row.
export default function Footer() {
  const links: { label: string; href: string }[] = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Proofs", href: "/proofs" },
    { label: "The board", href: "/board" },
  ];

  return (
    <footer className="max-md:relative flex flex-col max-md:px-4 lg:ml-3">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative isolate flex flex-col gap-16 lg:flex-row items-center justify-center w-full mx-auto px-6 py-16 md:p-16 xl:p-20 min-h-[70dvh] md:min-h-[60dvh] rounded-4xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-0 -z-10 rotate-180 rounded-4xl overflow-hidden bg-footer-radial-light lg:dark:bg-footer-radial-dark max-lg:bg-footer-radial-light-mobile max-lg:dark:bg-footer-radial-dark-mobile"
        />
        <section className="flex flex-col gap-6 z-10 text-center items-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-display font-bold text-hi"
          >
            The whistle is <br /> the opening bell
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="text-base max-w-md text-lo"
          >
            1,000 credits reset free every match. Open the terminal, read the River, and trade
            the World Cup as it happens.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
          >
            <Link href="/terminal" className={buttonVariants({ size: "lg" })}>
              Open the terminal
            </Link>
          </motion.div>
        </section>
      </motion.div>

      <section className="relative z-10 flex flex-col gap-8 lg:gap-10 items-center justify-center py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Wordmark />
        </motion.div>
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex flex-wrap justify-center gap-6 md:gap-8 text-muted-foreground text-sm"
        >
          {links.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="transition-colors duration-200 hover:text-hi">
                {link.label}
              </Link>
            </li>
          ))}
        </motion.ul>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center gap-1.5 text-center"
        >
          <p className="text-muted-foreground text-sm">
            &copy; 2026 Ninety · Play money — no deposits, no cash payouts, ever.
          </p>
          <p className="text-lo/70 text-xs">
            Landing structure adapted from notio (styleui.dev); crowd by skiper. Not affiliated with
            FIFA or the World Cup.
          </p>
        </motion.div>
      </section>
    </footer>
  );
}
