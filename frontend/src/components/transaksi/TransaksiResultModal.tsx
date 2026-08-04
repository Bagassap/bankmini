"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Receipt, Sparkles, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Transaksi } from "@/lib/types";

export type TransaksiResultState =
  | { status: "success"; data: Transaksi }
  | { status: "error"; message: string };

export function TransaksiResultModal({
  result,
  onClose,
  onPrintReceipt,
}: {
  result: TransaksiResultState | null;
  onClose: () => void;
  onPrintReceipt?: () => void;
}) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-background-card shadow-2xl"
          >
            {result.status === "success" ? (
              <SuccessContent data={result.data} onClose={onClose} onPrintReceipt={onPrintReceipt} />
            ) : (
              <ErrorContent message={result.message} onClose={onClose} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SuccessContent({
  data,
  onClose,
  onPrintReceipt,
}: {
  data: Transaksi;
  onClose: () => void;
  onPrintReceipt?: () => void;
}) {
  return (
    <>
      <div className="relative overflow-hidden bg-linear-to-br from-gradient-green-from to-gradient-green-to p-6 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-size-[14px_14px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-white/15 blur-2xl"
        />
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-white/20"
          />
          <CheckCircle2 size={32} className="relative" strokeWidth={2.5} />
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mt-3 flex items-center justify-center gap-1.5 text-base font-bold"
        >
          <Sparkles size={14} />
          Transaksi Berhasil!
        </motion.p>
        <p className="relative mt-1 text-xs text-white/80">
          Bukti transaksi tercatat otomatis di sistem
        </p>
      </div>

      <div className="p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">No Transaksi</dt>
            <dd className="font-mono text-text-primary">{data.noTransaksi}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Jenis</dt>
            <dd className="font-semibold text-text-primary">
              {data.jenisTransaksi === "setor" ? "Setor Tunai" : "Tarik Tunai"}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Jumlah</dt>
            <dd className="font-bold text-text-primary">{formatCurrency(data.jumlah)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Saldo Sebelum</dt>
            <dd className="text-text-primary">{formatCurrency(data.saldoSebelum)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
            <dt className="text-text-secondary">Saldo Sesudah</dt>
            <dd className="text-success">{formatCurrency(data.saldoSesudah)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex gap-2">
          {onPrintReceipt && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPrintReceipt}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-background-hover px-4 py-3 text-sm font-bold text-text-secondary transition-colors hover:text-text-primary"
            >
              <Receipt size={16} />
              Kuitansi
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-success px-4 py-3 text-sm font-bold text-white shadow-sm"
          >
            <CheckCircle2 size={16} />
            Selesai
          </motion.button>
        </div>
      </div>
    </>
  );
}

function ErrorContent({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <div className="relative overflow-hidden bg-linear-to-br from-[#f87171] to-[#b91c1c] p-6 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-size-[14px_14px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-2xl"
        />
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1, x: [0, -6, 6, -4, 4, 0] }}
          transition={{
            scale: { type: "spring", stiffness: 260, damping: 14 },
            x: { duration: 0.4, delay: 0.2 },
          }}
          className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
        >
          <AlertTriangle size={32} strokeWidth={2.5} />
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative mt-3 text-base font-bold"
        >
          Transaksi Gagal
        </motion.p>
        <p className="relative mt-1 text-xs text-white/80">Transaksi tidak dapat diproses</p>
      </div>

      <div className="p-5">
        <p className="flex items-start gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {message}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-danger px-4 py-3 text-sm font-bold text-white shadow-sm"
        >
          <X size={16} />
          Tutup &amp; Coba Lagi
        </motion.button>
      </div>
    </>
  );
}
