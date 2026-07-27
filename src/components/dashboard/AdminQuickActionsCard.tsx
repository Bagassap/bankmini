"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  FileBarChart2,
  History,
  UserCog,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";

const actions: {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ size?: number }>;
  color: string;
}[] = [
  {
    label: "Kelola Nasabah",
    description: "Data & status nasabah",
    href: "/admin/nasabah",
    icon: UserCog,
    color: "#1120f0",
  },
  {
    label: "Pantau Transaksi",
    description: "Awasi setor & tarik teller",
    href: "/admin/transaksi",
    icon: Eye,
    color: "#10b981",
  },
  {
    label: "Lihat Mutasi",
    description: "Riwayat transaksi nasabah",
    href: "/admin/mutasi",
    icon: History,
    color: "#f59e0b",
  },
  {
    label: "Lihat Laporan",
    description: "Ringkasan & unduh laporan",
    href: "/admin/laporan",
    icon: FileBarChart2,
    color: "#a78bfa",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function AdminQuickActionsCard() {
  const router = useRouter();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
      />

      <div className="relative mb-4 flex items-center gap-2.5">
        <motion.span
          initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning"
        >
          <Zap size={16} />
        </motion.span>
        <div>
          <p className="text-sm font-bold text-text-primary">Aksi Cepat</p>
          <p className="text-xs text-text-secondary">
            Navigasi langsung ke area pemantauan admin
          </p>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative grid grid-cols-2 gap-2.5"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              type="button"
              variants={itemVariants}
              onClick={() => router.push(action.href)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border border-border p-3 text-left transition-colors hover:border-transparent"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{ backgroundColor: `${action.color}0d` }}
              />

              <div className="relative flex w-full items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
                  style={{
                    backgroundColor: `${action.color}1a`,
                    color: action.color,
                  }}
                >
                  <Icon size={16} />
                </span>
                <ArrowRight
                  size={13}
                  className="-translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                  style={{ color: action.color }}
                />
              </div>

              <div className="relative">
                <p className="text-xs font-semibold text-text-primary">
                  {action.label}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">
                  {action.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
