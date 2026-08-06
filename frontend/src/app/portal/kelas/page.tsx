"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  Hash,
  PiggyBank,
  RefreshCw,
  School,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AnimatedCurrency } from "@/components/dashboard/AnimatedCurrency";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import type { KelasSummary } from "@/lib/types";

const PAGE_SIZE = 10;

const ROW_ACCENTS = [
  { bg: "#1120f0", soft: "rgba(17,32,240,0.1)" },
  { bg: "#10b981", soft: "rgba(16,185,129,0.1)" },
  { bg: "#ea580c", soft: "rgba(234,88,12,0.1)" },
  { bg: "#60a5fa", soft: "rgba(96,165,250,0.1)" },
  { bg: "#3b82f6", soft: "rgba(59,130,246,0.1)" },
];

export default function PortalKelasPage() {
  const [summary, setSummary] = useState<KelasSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const loadSummary = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const { data } = await api.get<KelasSummary>("/nasabah/me/kelas-summary");
      setSummary(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat ringkasan saldo kelas"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const topSiswa = useMemo(() => {
    if (!summary || summary.siswa.length === 0) return null;
    return summary.siswa.reduce((top, item) =>
      Number(item.saldo) > Number(top.saldo) ? item : top,
    );
  }, [summary]);

  const totalPages = summary ? Math.max(1, Math.ceil(summary.siswa.length / PAGE_SIZE)) : 1;
  const pagedSiswa = useMemo(() => {
    if (!summary) return [];
    return summary.siswa.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [summary, page]);

  const kasSaldo = summary?.kelasAccount ? Number(summary.kelasAccount.saldo) : 0;
  const siswaSaldo = summary ? Number(summary.totalSaldoSiswa) : 0;
  const totalGabungan = kasSaldo + siswaSaldo;
  const kasShare = totalGabungan > 0 ? Math.round((kasSaldo / totalGabungan) * 100) : 0;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-5 overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft sm:p-6 md:mb-7 2xl:mb-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
        />
        <div className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <motion.span
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              whileHover={{ scale: 1.08, rotate: 6 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
            >
              <ShieldCheck size={24} />
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background-card"
              />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Wali Kelas
              </p>
              <h1 className="text-2xl font-bold text-text-primary">
                Saldo Kelas {summary?.kelas ?? ""}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <School size={13} className="text-text-muted" />
                Pantau kas kelas &amp; tabungan seluruh siswa dalam satu layar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2.5 rounded-full bg-primary/10 py-1.5 pr-3.5 pl-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users size={16} />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-primary">
                  {summary?.totalSiswa ?? 0} Siswa
                </span>
                <span className="block text-[10px] text-primary/70">Terdaftar</span>
              </span>
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadSummary(true)}
              className="flex items-center gap-2.5 rounded-full bg-background-hover py-1.5 pr-3.5 pl-1.5"
            >
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <motion.span
                  animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.2 }
                  }
                  className="flex"
                >
                  <RefreshCw size={16} />
                </motion.span>
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-text-primary">Segarkan</span>
                <span className="block text-[10px] text-text-muted">Data terbaru</span>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {loading || !summary ? (
        <p className="text-sm text-text-secondary">Memuat data...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:gap-7.5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
              />
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start gap-3">
                <motion.span
                  whileHover={{ scale: 1.1, rotate: 8 }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <School size={20} />
                </motion.span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
                  <PiggyBank size={12} />
                  Kas Kelas
                </span>
              </div>

              <p className="relative mt-4 text-xs font-semibold tracking-widest text-white/70 uppercase">
                Saldo Kas Kelas
              </p>
              <AnimatedCurrency
                value={kasSaldo}
                className="relative mt-1 block text-3xl font-bold sm:text-4xl"
              />

              {summary.kelasAccount ? (
                <p className="relative mt-3 flex items-center gap-1.5 text-xs text-white/75">
                  <CreditCard size={13} />
                  <span className="font-mono">{summary.kelasAccount.noRekening}</span>
                </p>
              ) : (
                <p className="relative mt-3 flex items-center gap-1.5 text-xs text-white/75">
                  <XCircle size={13} />
                  Belum ada rekening kas kelas
                </p>
              )}

              <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/80">
                <TrendingUp size={13} className="shrink-0" />
                {kasShare}% dari total saldo kelas &amp; siswa
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gradient-green-from to-gradient-green-to p-6 text-white shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
              />
              <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start gap-3">
                <motion.span
                  whileHover={{ scale: 1.1, rotate: 8 }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <GraduationCap size={20} />
                </motion.span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
                  <Users size={12} />
                  {summary.totalSiswa} Siswa
                </span>
              </div>

              <p className="relative mt-4 text-xs font-semibold tracking-widest text-white/70 uppercase">
                Total Saldo Siswa
              </p>
              <AnimatedCurrency
                value={siswaSaldo}
                className="relative mt-1 block text-3xl font-bold sm:text-4xl"
              />

              <p className="relative mt-3 flex items-center gap-1.5 text-xs text-white/75">
                <Wallet size={13} />
                Rata-rata {formatCurrency(summary.totalSiswa > 0 ? siswaSaldo / summary.totalSiswa : 0)} / siswa
              </p>

              <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/80">
                <TrendingUp size={13} className="shrink-0" />
                {100 - kasShare}% dari total saldo kelas &amp; siswa
              </div>
            </motion.div>

            {topSiswa && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gradient-orange-from to-gradient-orange-to p-5 text-white shadow-soft"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[14px_14px]"
                />
                <div className="relative flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Award size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-widest text-white/75 uppercase">
                      Saldo Tertinggi
                    </p>
                    <p className="truncate text-sm font-bold">{topSiswa.nama}</p>
                  </div>
                </div>
                <p className="relative mt-3 text-xl font-bold">
                  {formatCurrency(topSiswa.saldo)}
                </p>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="overflow-hidden rounded-3xl bg-background-card shadow-soft"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white">
                  <Users size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Daftar Siswa</p>
                  <p className="text-xs text-text-secondary">
                    Saldo tabungan seluruh siswa kelas {summary.kelas}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-text-muted">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-background-hover text-text-secondary transition-colors hover:bg-border disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-background-hover text-text-secondary transition-colors hover:bg-border disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-background-hover">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                      #
                    </th>
                    <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                      NIS
                    </th>
                    <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
                >
                  {pagedSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-text-secondary">
                          <Users size={26} className="text-text-muted" />
                          Belum ada siswa di kelas ini
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedSiswa.map((siswa, index) => {
                      const accent = ROW_ACCENTS[((page - 1) * PAGE_SIZE + index) % ROW_ACCENTS.length];
                      const rowNumber = (page - 1) * PAGE_SIZE + index + 1;
                      return (
                        <motion.tr
                          key={siswa.id}
                          variants={{
                            hidden: { opacity: 0, y: 6 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                          }}
                          className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                        >
                          <td className="px-4 py-3">
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                              style={{ backgroundColor: accent.soft, color: accent.bg }}
                            >
                              {rowNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: accent.bg }}
                              >
                                {siswa.nama.slice(0, 2).toUpperCase()}
                              </span>
                              <p className="min-w-0 truncate font-medium text-text-primary">
                                {siswa.nama}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-background-hover px-2.5 py-1 font-mono text-xs text-text-secondary">
                              <Hash size={11} className="text-text-muted" />
                              {siswa.nis ?? siswa.noRekening}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                                siswa.status === "aktif"
                                  ? "bg-success/15 text-success"
                                  : "bg-background-hover text-text-secondary"
                              }`}
                            >
                              {siswa.status === "aktif" ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              {siswa.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold" style={{ color: accent.bg }}>
                              {formatCurrency(siswa.saldo)}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </motion.tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-text-muted">
              <span>
                Menampilkan {pagedSiswa.length} dari {summary.siswa.length} siswa
              </span>
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-primary" />
                10 data per halaman
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
