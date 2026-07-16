"use client";
import { AnimatePresence, motion } from "motion/react";
import { MenuIcon, XIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Wordmark } from "src/components/ui/Wordmark";

// notio's floating-pill nav, re-skinned to Ninety: our Wordmark + WC26 chip left, real routes + the
// one filled CTA ("Open the terminal") right. Dropped notio's logo SVGs, theme toggle, and auth links.
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: { label: string; href: string }[] = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Proofs", href: "/proofs" },
  ];

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 mx-2 md:mx-4 lg:mx-6 w-[calc(100%-1rem)] md:max-w-3xl lg:max-w-5xl xl:max-w-6xl bg-background/80 backdrop-blur-md py-2 px-4 rounded-xl border border-hairline/70">
      <nav aria-label="Primary" className="flex flex-row justify-between items-center py-1">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Wordmark tag="WC26" />
        </motion.div>

        <div className="hidden md:flex flex-row items-center gap-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 + index * 0.1 }}
            >
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-chip px-3 text-sm font-medium text-lo outline-none transition-colors duration-200 hover:text-hi focus-visible:text-hi focus-visible:ring-2 focus-visible:ring-up/60"
              >
                {item.label}
              </Link>
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 + navItems.length * 0.1 }}
          >
            <Link
              href="/terminal"
              className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-chip bg-up px-4 text-sm font-semibold text-bg outline-none transition-opacity duration-200 hover:opacity-90 active:opacity-80 focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Open the terminal <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="md:hidden"
        >
          <button
            className="flex h-11 w-11 items-center justify-center rounded-chip text-hi outline-none focus-visible:ring-2 focus-visible:ring-up/60"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.span key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                  <XIcon className="w-6 h-6" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                  <MenuIcon className="w-6 h-6" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </nav>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-1 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex min-h-11 items-center px-2 text-sm font-medium text-lo hover:text-hi"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/terminal"
                className="mt-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-chip bg-up px-4 text-sm font-semibold text-bg"
                onClick={() => setIsOpen(false)}
              >
                Open the terminal <ArrowRight className="h-4 w-4" aria-hidden strokeWidth={2.25} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
