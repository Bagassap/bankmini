"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Hash,
  ListFilter,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Tag,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Layout from "@/components/Layout";
import { DateRangePicker } from "@/components/DateRangePicker";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import type { JenisTransaksi, Transaksi } from "@/lib/types";

const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-xl border border-transparent bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const JENIS_FILTERS: { label: string; value: JenisTransaksi | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Setor", value: "setor" },
  { label: "Tarik", value: "tarik" },
];

export default function AdminTransaksiPage() {
  const [jenisFilter, setJenisFilter] = useState<JenisTransaksi | "all">("all");
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [data, setData] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Transaksi | null>(null);

  const loadTransaksi = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const { data: res } = await api.get<Transaksi[]>("/transaksi", {
          params: {
            jenisTransaksi: jenisFilter === "all" ? undefined : jenisFilter,
            from: from || undefined,
            to: to ? `${to}T23:59:59.999` : undefined,
            limit: 200,
          },
        });
        setData(res);
        setPage(1);
      } catch (error) {
        toast.error(getErrorMessage(error, "Gagal memuat data transaksi"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [jenisFilter, from, to],
  );

  useEffect(() => {
    loadTransaksi();
  }, [loadTransaksi]);

  const stats = useMemo(() => {
    const setorList = data.filter((t) => t.jenisTransaksi === "setor");
    const tarikList = data.filter((t) => t.jenisTransaksi === "tarik");
    const totalSetor = setorList.reduce((sum, t) => sum + Number(t.jumlah), 0);
    const totalTarik = tarikList.reduce((sum, t) => sum + Number(t.jumlah), 0);
    const totalVolume = totalSetor + totalTarik;
    return {
      totalCount: data.length,
      setorCount: setorList.length,
      tarikCount: tarikList.length,
      totalSetor,
      totalTarik,
      setorShare: totalVolume > 0 ? Math.round((totalSetor / totalVolume) * 100) : 0,
    };
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxAmount = Math.max(...data.map((t) => Number(t.jumlah)), 1);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 flex flex-col justify-between gap-4 md:mb-7 md:flex-row md:items-end 2xl:mb-8"
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="h-1.5 w-1.5 rounded-full bg-primary"
              />
              <Zap size={11} />
              Live Data
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">
              <ShieldCheck size={11} />
              Mode Pemantauan
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Pantau Transaksi</h1>
          <p className="text-sm text-text-secondary">
            Awasi seluruh setoran &amp; penarikan yang diproses teller — khusus lihat, tanpa input transaksi.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => loadTransaksi(true)}
          className="flex items-center gap-1.5 rounded-xl bg-background-card px-4 py-2.5 text-sm font-bold text-text-secondary shadow-soft transition-colors hover:text-primary"
        >
          <motion.span
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={
              refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0.2 }
            }
            className="flex"
          >
            <RefreshCw size={14} />
          </motion.span>
          Segarkan
        </motion.button>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3 md:mb-6 2xl:mb-7.5"
      >
        <motion.div
          variants={cardVariants}
          className="relative flex flex-col overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
          />
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <ListFilter size={20} />
            </span>
            <div>
              <p className="text-sm font-bold">Filter Transaksi</p>
              <p className="text-xs text-white/70">Jenis &amp; rentang tanggal</p>
            </div>
          </div>

          <div className="relative mt-5 flex gap-2">
            {JENIS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setJenisFilter(f.value)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  jenisFilter === f.value
                    ? "bg-white text-primary shadow-sm"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative mt-4">
            <DateRangePicker from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          </div>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft lg:col-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
          />

          <div className="relative mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">Ringkasan Periode</p>
              <p className="text-xs text-text-secondary">
                Total aktivitas sesuai filter yang dipilih
              </p>
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="relative grid grid-cols-3 gap-3"
          >
            {[
              {
                label: "Total Transaksi",
                caption: `${stats.totalCount} transaksi tercatat`,
                value: stats.totalCount,
                icon: ClipboardList,
                gradient: "from-primary to-primary-dark",
              },
              {
                label: "Setor",
                caption: formatCurrency(stats.totalSetor),
                value: stats.setorCount,
                icon: ArrowDownToLine,
                gradient: "from-gradient-green-from to-gradient-green-to",
              },
              {
                label: "Tarik",
                caption: formatCurrency(stats.totalTarik),
                value: stats.tarikCount,
                icon: ArrowUpFromLine,
                gradient: "from-gradient-orange-from to-gradient-orange-to",
              },
            ].map((tile) => (
              <motion.div
                key={tile.label}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                className={`relative overflow-hidden rounded-2xl bg-linear-to-br p-4 text-white shadow-sm transition-shadow hover:shadow-md ${tile.gradient}`}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[12px_12px]"
                />
                <motion.span
                  initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
                >
                  <tile.icon size={15} />
                </motion.span>
                <div className="relative mt-3 flex items-center gap-2">
                  <p className="text-2xl font-bold">{tile.value}</p>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-[11px] font-semibold text-white/85">{tile.label}</p>
                    <p className="truncate text-[10px] text-white/60">{tile.caption}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="relative mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs">
            <span className="font-semibold text-text-secondary">Proporsi Setor vs Tarik</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background-hover">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.setorShare}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-success"
              />
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
              {stats.setorShare}% : {100 - stats.setorShare}%
            </span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="overflow-hidden rounded-3xl bg-background-card shadow-soft"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">Daftar Transaksi</p>
              <p className="text-xs text-text-secondary">
                Seluruh nasabah, diurutkan dari yang terbaru
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

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
          className="divide-y divide-border"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-text-secondary">
              <Loader2 size={22} className="animate-spin text-primary" />
              Memuat data transaksi...
            </div>
          ) : pagedData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-text-secondary">
              <ClipboardList size={26} className="text-text-muted" />
              Tidak ada transaksi pada periode ini
            </div>
          ) : (
            pagedData.map((trx) => {
              const isSetor = trx.jenisTransaksi === "setor";
              const percent = Math.round((Number(trx.jumlah) / maxAmount) * 100);
              return (
                <motion.div
                  key={trx.id}
                  variants={rowVariants}
                  className="flex flex-col gap-3 p-5 transition-colors hover:bg-background-hover sm:flex-row sm:items-center"
                >
                  <div className="flex shrink-0 items-center gap-3 sm:w-56">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSetor ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {isSetor ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {trx.nasabah?.nama ?? "-"}
                      </p>
                      <p className="font-mono text-[11px] text-text-muted">
                        {trx.nasabah?.noRekening ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {isSetor ? "Setor Tunai" : "Tarik Tunai"}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                      <Tag size={11} />
                      {formatDate(trx.createdAt)} &middot; {trx.keterangan ?? "-"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-background-hover">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${isSetor ? "bg-success" : "bg-danger"}`}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-text-muted">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className={`font-bold ${isSetor ? "text-success" : "text-danger"}`}>
                        {isSetor ? "+" : "-"}
                        {formatCurrency(trx.jumlah)}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                        <CheckCircle2 size={10} />
                        Success
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setViewing(trx)}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Eye size={12} />
                      Detail
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewing(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div className="relative mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                      viewing.jenisTransaksi === "setor" ? "bg-success" : "bg-danger"
                    }`}
                  >
                    {viewing.jenisTransaksi === "setor" ? (
                      <ArrowDownToLine size={20} />
                    ) : (
                      <ArrowUpFromLine size={20} />
                    )}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary capitalize">
                      {viewing.jenisTransaksi === "setor" ? "Setor Tunai" : "Tarik Tunai"}
                    </h2>
                    <p className="font-mono text-xs text-text-secondary">{viewing.noTransaksi}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewing(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative space-y-3">
                <div className="rounded-2xl border border-border p-3">
                  <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                    <Users size={10} /> Nasabah
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-text-primary">
                    {viewing.nasabah?.nama ?? "-"}
                  </p>
                  <p className="font-mono text-xs text-text-muted">
                    {viewing.nasabah?.noRekening ?? "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border p-3">
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      <Hash size={10} /> Jumlah
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-bold ${
                        viewing.jenisTransaksi === "setor" ? "text-success" : "text-danger"
                      }`}
                    >
                      {formatCurrency(viewing.jumlah)}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      <Calendar size={10} /> Waktu
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-text-primary">
                      {formatDate(viewing.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      <Wallet size={10} /> Saldo Sebelum
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-text-primary">
                      {formatCurrency(viewing.saldoSebelum)}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      <Wallet size={10} /> Saldo Sesudah
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-primary">
                      {formatCurrency(viewing.saldoSesudah)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border p-3">
                  <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                    <ClipboardList size={10} /> Keterangan
                  </p>
                  <p className="mt-0.5 text-sm text-text-primary">
                    {viewing.keterangan ?? "-"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                  <CheckCircle2 size={13} />
                  Transaksi berhasil &amp; tercatat di sistem
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewing(null)}
                className="relative mt-5 w-full rounded-xl bg-background-hover px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-border"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
