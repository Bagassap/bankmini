"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import { AnimatedCurrency } from "./AnimatedCurrency";

type Tone = "success" | "danger";

const TONE_STYLES: Record<Tone, { chip: string; bar: string }> = {
  success: { chip: "bg-success/10 text-success", bar: "bg-success" },
  danger: { chip: "bg-danger/10 text-danger", bar: "bg-danger" },
};

export function CashFlowCard({
  label,
  value,
  count,
  proportion,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  count: number;
  proportion: number;
  icon: ComponentType<{ size?: number }>;
  tone: Tone;
}) {
  const styles = TONE_STYLES[tone];
  const average = count > 0 ? value / count : 0;

  return (
    <div className="rounded-3xl bg-background-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.chip}`}
        >
          <Icon size={16} />
        </span>
        <p className="text-xs font-semibold text-text-primary">{label}</p>
      </div>

      <AnimatedCurrency
        value={value}
        className="mt-3 block text-xl font-bold text-text-primary"
      />
      <p className="mt-0.5 text-[11px] text-text-muted">
        {count} transaksi &middot; rata-rata {" "}
        {average.toLocaleString("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </p>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-muted">
        <span>Porsi arus kas hari ini</span>
        <span className="font-semibold text-text-primary">{proportion}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-background-hover">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${proportion}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${styles.bar}`}
        />
      </div>
    </div>
  );
}
