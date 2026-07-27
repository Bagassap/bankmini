"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { SETOR_META, TARIK_META, type TransaksiMeta } from "@/lib/transaksiMeta";

export function TransaksiHeader({
  meta,
  now,
}: {
  meta: TransaksiMeta;
  now: Date | null;
}) {
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative mb-5 overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft md:mb-7 2xl:mb-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: `${meta.color}22` }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ scale: 0.6, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            whileHover={{ scale: 1.08, rotate: 6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-sm ${meta.gradient}`}
          >
            <Icon size={22} />
          </motion.span>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-text-primary">{meta.title}</h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.bg} ${meta.text}`}
            >
              <Icon size={12} />
              Input Mode
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {[SETOR_META, TARIK_META].map((m) => {
            const active = m.tab === meta.tab;
            const TIcon = m.icon;
            return (
              <Link
                key={m.tab}
                href={`/transaksi/${m.tab}`}
                className="relative rounded-xl px-5 py-2.5 text-sm font-bold"
              >
                {active && (
                  <span
                    className={`absolute inset-0 rounded-xl bg-linear-to-br shadow-sm ${m.gradient}`}
                  />
                )}
                <span
                  className={`relative flex items-center gap-1.5 transition-colors ${
                    active ? "text-white" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <TIcon size={14} />
                  {m.tab === "setor" ? "Setor" : "Tarik"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="relative mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">{meta.subtitle}</p>

        <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-border bg-background-hover py-1.5 pr-4 pl-1.5 sm:self-auto">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock size={14} />
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-background-card"
            />
          </span>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              {now
                ? now.toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
            <p className="font-mono text-sm font-bold text-text-primary">
              {now ? now.toLocaleTimeString("id-ID") : "—"}
              <span className="ml-1 text-[10px] font-semibold text-text-muted">WIB</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
