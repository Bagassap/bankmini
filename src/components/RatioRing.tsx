"use client";

import { motion } from "framer-motion";

export function RatioRing({
  percent,
  label = "Setor",
  color = "#22c55e",
  size = 96,
}: {
  percent: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={8} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold text-text-primary">{percent}%</p>
        <p className="text-[9px] font-semibold tracking-wide text-text-muted uppercase">{label}</p>
      </div>
    </div>
  );
}
