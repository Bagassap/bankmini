"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, History } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaksi } from "@/lib/types";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

function relativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function TransactionList({
  data,
  className,
  mutasiHref = "/mutasi",
}: {
  data: Transaksi[];
  className?: string;
  mutasiHref?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-3xl bg-background-card p-6 shadow-soft ${className ?? ""}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History size={16} />
          </span>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Transaksi Terakhir
            </h3>
            <p className="text-xs text-text-secondary">
              Aktivitas setor &amp; tarik tunai paling baru
            </p>
          </div>
        </div>
        <span className="rounded-full bg-background-hover px-2.5 py-1 text-xs font-medium text-text-muted">
          {data.length} transaksi terbaru
        </span>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">
          Belum ada transaksi
        </p>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={listVariants}
          className="space-y-1"
        >
          {data.map((trx) => {
            const isSetor = trx.jenisTransaksi === "setor";
            return (
              <motion.div
                key={trx.id}
                variants={rowVariants}
                whileHover={{ x: 2 }}
                className={`group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl px-3 py-3 transition-colors hover:bg-background-hover`}
              >
                <span
                  className={`absolute inset-y-2 left-0 w-1 rounded-full ${
                    isSetor ? "bg-success" : "bg-danger"
                  }`}
                />
                <div className="flex items-center gap-3 pl-2">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${
                      isSetor
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger"
                    }`}
                  >
                    {isSetor ? (
                      <ArrowDownToLine size={16} />
                    ) : (
                      <ArrowUpFromLine size={16} />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {isSetor ? "Setor Tunai" : "Tarik Tunai"} &middot;{" "}
                      {trx.nasabah?.nama ?? "-"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {relativeTime(trx.createdAt)} &middot;{" "}
                      {formatDate(trx.createdAt)}
                    </p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${
                    isSetor ? "text-success" : "text-danger"
                  }`}
                >
                  {isSetor ? "+ " : "- "}
                  {formatCurrency(trx.jumlah)}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Link
        href={mutasiHref}
        className="group mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
      >
        Lihat Semua Mutasi
        <ArrowRight
          size={14}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </Link>
    </motion.div>
  );
}
