"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Hash, Loader2, ShieldCheck, UserCircle2, Users, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { GUIDE_COLORS, JENIS_ICON, jenisLabel, type TransaksiMeta } from "@/lib/transaksiMeta";
import type { Nasabah } from "@/lib/types";

export function TransaksiRightPanel({
  meta,
  nasabah,
  submitting,
  submitDisabled,
  formId,
  onCancel,
}: {
  meta: TransaksiMeta;
  nasabah: Nasabah | null;
  submitting: boolean;
  submitDisabled: boolean;
  formId: string;
  onCancel: () => void;
}) {
  const Icon = meta.icon;
  const JenisIcon = nasabah ? JENIS_ICON[nasabah.jenisNasabah] : Users;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-background-card shadow-soft">
        <div
          className={`relative flex flex-col items-center gap-2 overflow-hidden bg-linear-to-br p-6 text-center ${meta.gradient}`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl"
          />
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
          >
            {nasabah ? (
              <CheckCircle2 size={26} className="text-white" />
            ) : (
              <Icon size={26} className="text-white" />
            )}
          </motion.div>
          <p className="relative text-sm font-bold text-white">
            {nasabah ? "Nasabah Terverifikasi" : "Menunggu Input..."}
          </p>
          <div className="relative flex flex-wrap items-center justify-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                nasabah
                  ? nasabah.status === "aktif"
                    ? "bg-white/25 text-white"
                    : "bg-white/15 text-white/70"
                  : "bg-white/15 text-white/70"
              }`}
            >
              <CheckCircle2 size={10} />
              {nasabah ? `Status: ${nasabah.status}` : "Status: -"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
              <JenisIcon size={10} />
              {nasabah ? jenisLabel[nasabah.jenisNasabah] : "-"}
            </span>
          </div>
        </div>

        <div className="relative space-y-2.5 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Hash size={11} style={{ color: GUIDE_COLORS[0] }} /> No. Rekening
            </span>
            <span className="font-mono font-semibold text-text-primary">
              {nasabah?.noRekening ?? "-"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <UserCircle2 size={11} style={{ color: GUIDE_COLORS[1] }} /> Jenis Kelamin
            </span>
            <span className="font-semibold text-text-primary">
              {nasabah?.jenisKelamin ?? "-"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Wallet size={11} style={{ color: GUIDE_COLORS[2] }} /> Saldo Saat Ini
            </span>
            <span className="font-bold text-primary">
              {nasabah ? formatCurrency(nasabah.saldo) : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-background-card p-4 shadow-soft">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-text-primary">
          <ShieldCheck size={14} className="text-primary" />
          Panduan Keamanan
        </p>
        <ol className="space-y-2.5">
          {meta.tips.map((tip, i) => (
            <li key={tip} className="flex gap-2 text-xs text-text-secondary">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: GUIDE_COLORS[i % GUIDE_COLORS.length] }}
              >
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-2">
        <motion.button
          type="submit"
          form={formId}
          whileHover={{ scale: submitDisabled ? 1 : 1.02 }}
          whileTap={{ scale: submitDisabled ? 1 : 0.97 }}
          disabled={submitDisabled}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-br px-4 py-3.5 text-sm font-bold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${meta.gradient}`}
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Icon size={16} />
          )}
          {submitting ? "Memproses..." : meta.submitLabel}
        </motion.button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-2xl bg-background-card px-4 py-2.5 text-xs font-semibold text-text-secondary shadow-soft transition-colors hover:text-danger"
        >
          Batalkan Transaksi
        </button>
        <p className="flex items-center justify-center gap-1 text-center text-[10px] text-text-muted">
          <ShieldCheck size={10} />
          Transaksi tercatat otomatis di riwayat mutasi
        </p>
      </div>
    </div>
  );
}
