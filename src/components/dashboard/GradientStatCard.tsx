"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { AnimatedCurrency } from "./AnimatedCurrency";

type Tone = "orange" | "blue" | "cyan" | "green";

const TONE_GRADIENT: Record<Tone, string> = {
  orange: "from-gradient-orange-from to-gradient-orange-to",
  blue: "from-primary to-primary-dark",
  cyan: "from-gradient-blue-from to-gradient-blue-to",
  green: "from-gradient-green-from to-gradient-green-to",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function GradientStatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  secondaryLabel,
  secondaryIcon: SecondaryIcon,
}: {
  label: string;
  value: number;
  caption?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: Tone;
  secondaryLabel?: string;
  secondaryIcon?: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${TONE_GRADIENT[tone]} p-6 text-white shadow-soft transition-shadow hover:shadow-lg`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
      />
      <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <motion.span
        initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.1, rotate: 8 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
      >
        <Icon size={18} />
      </motion.span>
      <p className="relative mt-5 text-sm font-medium text-white/85">
        {label}
      </p>
      <AnimatedCurrency
        value={value}
        className="relative mt-1 block text-2xl font-bold"
      />
      {caption && (
        <p className="relative mt-1 text-xs text-white/70">{caption}</p>
      )}
      {secondaryLabel && (
        <div className="relative mt-3 flex items-center gap-1.5 border-t border-white/15 pt-3 text-[11px] font-medium text-white/80">
          {SecondaryIcon && <SecondaryIcon size={12} className="shrink-0" />}
          {secondaryLabel}
        </div>
      )}
    </motion.div>
  );
}
