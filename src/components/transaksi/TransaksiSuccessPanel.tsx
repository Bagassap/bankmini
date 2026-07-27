"use client";

import { motion } from "framer-motion";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Transaksi } from "@/lib/types";

export function TransaksiSuccessPanel({ result }: { result: Transaksi }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative mt-4 overflow-hidden rounded-3xl border border-success/30 bg-success/5 p-6 shadow-soft md:mt-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
          <Receipt size={18} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-success">Transaksi Berhasil</h2>
          <p className="text-xs text-text-secondary">Bukti transaksi tercatat di sistem</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-text-secondary sm:grid-cols-2">
        <div className="flex justify-between">
          <dt>No Transaksi</dt>
          <dd className="font-mono">{result.noTransaksi}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Jenis</dt>
          <dd className="capitalize">{result.jenisTransaksi}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Jumlah</dt>
          <dd className="font-semibold text-text-primary">{formatCurrency(result.jumlah)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Saldo Sebelum</dt>
          <dd>{formatCurrency(result.saldoSebelum)}</dd>
        </div>
        <div className="flex justify-between font-semibold sm:col-span-2">
          <dt>Saldo Sesudah</dt>
          <dd className="text-success">{formatCurrency(result.saldoSesudah)}</dd>
        </div>
      </dl>
    </motion.div>
  );
}
