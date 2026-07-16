"use client";

import { FeatureCardProps } from "src/types/components/feature";
import { Activity, Radio, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import FeatureCard from "./feature-card";
export default function Features() {
  const features: FeatureCardProps[] = [
    {
      title: "Prices move with the game",
      description:
        "Every goal, red card, and shot on target re-prices the market in real time. The tape moves the instant the match does.",
      icon: Activity,
    },
    {
      title: "The Booth explains every swing",
      description:
        "A live commentary voice calls each move the moment it lands, so a price jump always comes with a reason.",
      icon: Radio,
    },
    {
      title: "Solana proves the result",
      description:
        "When a match settles, the outcome is verified on-chain. Anyone can check the proof — no trust required.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-8 items-center justify-center p-4">
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-3xl md:text-4xl 4xl:text-6xl font-aleo text-center text-hi"
      >
        Read the game as a market
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="text-lg text-center max-w-2xl text-muted-foreground 4xl:text-3xl 4xl:max-w-6xl"
      >
        Outcome, probability, chart, trade — the same spine as a real exchange, built for
        ninety minutes of football instead of a quarterly earnings call.
      </motion.p>
      <section className="flex flex-wrap items-stretch justify-center gap-4 max-md:pt-8 md:gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            className="flex"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.5,
              delay: 0.2 + index * 0.15,
              ease: "easeOut",
            }}
          >
            <FeatureCard feature={feature} />
          </motion.div>
        ))}
      </section>
    </div>
  );
}
