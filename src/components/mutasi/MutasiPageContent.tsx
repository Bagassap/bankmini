"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Hash,
  Loader2,
  Printer,
  Search,
  ShieldCheck,
  Tag,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Layout from "@/components/Layout";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Nasabah, Transaksi } from "@/lib/types";

const PAGE_SIZE = 8;

/* ---------------------------------------------------------------------- */
/* Data demo — ditampilkan sebagai tampilan bawaan sebelum teller mencari  */
/* nasabah sungguhan, supaya halaman tidak pernah terlihat kosong.         */
/* ---------------------------------------------------------------------- */

const DUMMY_NASABAH: Nasabah = {
  id: "dummy",
  noRekening: "0000000000",
  nama: "Rekening Demo",
  jenisNasabah: "umum",
  saldo: 2_250_000,
  status: "aktif",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DUMMY_MUTASI: Transaksi[] = [
  {
    id: "dummy-1",
    noTransaksi: "TRX-DEMO-0001",
    nasabahId: "dummy",
    jenisTransaksi: "setor",
    jumlah: 500_000,
    saldoSebelum: 1_750_000,
    saldoSesudah: 2_250_000,
    keterangan: "Setoran tabungan bulanan",
    processedById: "dummy",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "dummy-2",
    noTransaksi: "TRX-DEMO-0002",
    nasabahId: "dummy",
    jenisTransaksi: "tarik",
    jumlah: 150_000,
    saldoSebelum: 2_250_000,
    saldoSesudah: 2_100_000,
    keterangan: "Tarik jajan",
    processedById: "dummy",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "dummy-3",
    noTransaksi: "TRX-DEMO-0003",
    nasabahId: "dummy",
    jenisTransaksi: "setor",
    jumlah: 750_000,
    saldoSebelum: 1_500_000,
    saldoSesudah: 2_250_000,
    keterangan: "Setoran dari orang tua",
    processedById: "dummy",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
  },
  {
    id: "dummy-4",
    noTransaksi: "TRX-DEMO-0004",
    nasabahId: "dummy",
    jenisTransaksi: "tarik",
    jumlah: 200_000,
    saldoSebelum: 1_700_000,
    saldoSesudah: 1_500_000,
    keterangan: "Tarik kebutuhan pribadi",
    processedById: "dummy",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 78).toISOString(),
  },
];

const DUMMY_INFLOW = DUMMY_MUTASI.filter((t) => t.jenisTransaksi === "setor").reduce(
  (sum, t) => sum + Number(t.jumlah),
  0,
);
const DUMMY_OUTFLOW = DUMMY_MUTASI.filter((t) => t.jenisTransaksi === "tarik").reduce(
  (sum, t) => sum + Number(t.jumlah),
  0,
);
const DUMMY_STATS = {
  totalInflow: DUMMY_INFLOW,
  totalOutflow: DUMMY_OUTFLOW,
  netBalance: DUMMY_INFLOW - DUMMY_OUTFLOW,
  setorCount: DUMMY_MUTASI.filter((t) => t.jenisTransaksi === "setor").length,
  tarikCount: DUMMY_MUTASI.filter((t) => t.jenisTransaksi === "tarik").length,
  inflowShare: Math.round((DUMMY_INFLOW / (DUMMY_INFLOW + DUMMY_OUTFLOW)) * 100),
  outflowShare: 100 - Math.round((DUMMY_INFLOW / (DUMMY_INFLOW + DUMMY_OUTFLOW)) * 100),
};

const inputClass =
  "w-full rounded-xl border border-transparent bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function RatioRing({ percent }: { percent: number }) {
  const size = 96;
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
          stroke="#22c55e"
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
        <p className="text-[9px] font-semibold tracking-wide text-text-muted uppercase">Setor</p>
      </div>
    </div>
  );
}

export function MutasiPageContent() {
  const noRekeningRef = useRef<HTMLInputElement>(null);
  const [noRekening, setNoRekening] = useState("");
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [searching, setSearching] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mutasi, setMutasi] = useState<Transaksi[]>([]);
  const [loadingMutasi, setLoadingMutasi] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Transaksi | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!noRekening) return;
    setSearching(true);
    setNasabah(null);
    setMutasi([]);
    try {
      const { data } = await api.get<Nasabah>(
        `/nasabah/no-rekening/${noRekening}`,
      );
      setNasabah(data);
    } catch (error) {
      toast.error(getErrorMessage(error, "Nasabah tidak ditemukan"));
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!nasabah) return;
    async function loadMutasi() {
      setLoadingMutasi(true);
      try {
        const { data } = await api.get<Transaksi[]>(
          `/transaksi/mutasi/${nasabah!.id}`,
          { params: { from: from || undefined, to: to || undefined } },
        );
        setMutasi(data);
        setPage(1);
      } catch (error) {
        toast.error(getErrorMessage(error, "Gagal memuat mutasi transaksi"));
      } finally {
        setLoadingMutasi(false);
      }
    }
    loadMutasi();
  }, [nasabah, from, to]);

  const stats = useMemo(() => {
    const totalInflow = mutasi
      .filter((t) => t.jenisTransaksi === "setor")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);
    const totalOutflow = mutasi
      .filter((t) => t.jenisTransaksi === "tarik")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);
    const setorCount = mutasi.filter((t) => t.jenisTransaksi === "setor").length;
    const tarikCount = mutasi.filter((t) => t.jenisTransaksi === "tarik").length;
    const totalVolume = totalInflow + totalOutflow;
    const inflowShare = totalVolume > 0 ? Math.round((totalInflow / totalVolume) * 100) : 0;
    const outflowShare = totalVolume > 0 ? 100 - inflowShare : 0;
    return {
      totalInflow,
      totalOutflow,
      netBalance: totalInflow - totalOutflow,
      setorCount,
      tarikCount,
      inflowShare,
      outflowShare,
    };
  }, [mutasi]);

  const totalPages = Math.max(1, Math.ceil(mutasi.length / PAGE_SIZE));
  const pagedMutasi = mutasi.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const displayNasabah = nasabah ?? DUMMY_NASABAH;
  const displayStats = nasabah ? stats : DUMMY_STATS;
  const displayList = nasabah ? pagedMutasi : DUMMY_MUTASI;
  const displayTotalPages = nasabah ? totalPages : 1;
  const displayLoading = nasabah ? loadingMutasi : false;
  const displayCount = nasabah ? mutasi.length : DUMMY_MUTASI.length;
  const maxAmount = Math.max(...displayList.map((t) => Number(t.jumlah)), 1);

  function exportCsv() {
    const rows = [
      ["No Transaksi", "Tanggal", "Jenis", "Jumlah", "Saldo Sesudah", "Keterangan"],
      ...mutasi.map((t) => [
        t.noTransaksi,
        t.createdAt,
        t.jenisTransaksi,
        String(t.jumlah),
        String(t.saldoSesudah),
        t.keterangan ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mutasi-${nasabah?.noRekening ?? "rekening"}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout>
      {/* Header */}
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
              Data Terverifikasi
            </span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Mutasi Rekening</h1>
          <p className="text-sm text-text-secondary">
            Pantau arus kas masuk dan keluar nasabah dalam satu tampilan.
          </p>
        </div>

        {nasabah && (
          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-xl bg-background-card px-4 py-2.5 text-sm font-bold text-text-secondary shadow-soft transition-colors hover:text-primary"
            >
              <Download size={14} />
              Export CSV
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              <Printer size={14} />
              Cetak
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Illustration/CTA + Ringkasan Transaksi */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3 md:mb-6 2xl:mb-7.5"
      >
        {/* Illustration / CTA card */}
        <motion.div
          variants={cardVariants}
          className="relative flex flex-col overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
          />
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <motion.span
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur-sm"
            >
              {displayNasabah.nama.slice(0, 2).toUpperCase()}
            </motion.span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{displayNasabah.nama}</p>
              <p className="flex items-center gap-1 font-mono text-xs text-white/70">
                <Hash size={11} />
                {displayNasabah.noRekening}
              </p>
            </div>
          </div>

          <div className="relative mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/70 uppercase">
              <Wallet size={11} />
              Saldo Saat Ini
            </p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(displayNasabah.saldo)}</p>
          </div>

          <p className="relative mt-4 text-xs text-white/70">
            Ingin melihat rekening lain? Gunakan form pencarian di kartu sebelah untuk
            menampilkan riwayat transaksi nasabah pilihan Anda.
          </p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => noRekeningRef.current?.focus()}
            className="relative mt-4 flex w-fit items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm"
          >
            <Search size={16} />
            Cari Nasabah Lain
          </motion.button>
        </motion.div>

        {/* Ringkasan Transaksi */}
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
              <p className="text-sm font-bold text-text-primary">Ringkasan Mutasi</p>
              <p className="text-xs text-text-secondary">
                Cari nasabah &amp; pantau arus kas dalam satu tempat
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
          >
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Building2 size={12} className="text-primary" />
                Nomor Rekening
              </label>
              <input
                ref={noRekeningRef}
                type="text"
                value={noRekening}
                onChange={(e) => setNoRekening(e.target.value)}
                placeholder="Contoh: 0981223445"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={12} className="text-primary" />
                Dari Tanggal
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={12} className="text-primary" />
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputClass}
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={searching}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {searching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              {searching ? "Mencari..." : "Cari Riwayat"}
            </motion.button>
          </form>

          <div className="relative flex flex-col gap-6 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  {
                    label: "Total Transaksi",
                    caption: "Tercatat periode ini",
                    value: displayCount,
                    icon: ClipboardList,
                    gradient: "from-primary to-primary-dark",
                  },
                  {
                    label: "Setor",
                    caption: "Dana masuk",
                    value: displayStats.setorCount,
                    icon: ArrowDownToLine,
                    gradient: "from-gradient-green-from to-gradient-green-to",
                  },
                  {
                    label: "Tarik",
                    caption: "Dana keluar",
                    value: displayStats.tarikCount,
                    icon: ArrowUpFromLine,
                    gradient: "from-gradient-orange-from to-gradient-orange-to",
                  },
                ].map((tile) => (
                  <motion.div
                    key={tile.label}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -3 }}
                    className={`relative overflow-hidden rounded-2xl bg-linear-to-br p-3.5 text-white shadow-sm transition-shadow hover:shadow-md ${tile.gradient}`}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[12px_12px]"
                    />
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
                    >
                      <tile.icon size={14} />
                    </motion.span>
                    <p className="relative mt-2.5 text-xl font-bold">{tile.value}</p>
                    <p className="relative text-[10px] font-semibold text-white/85">{tile.label}</p>
                    <p className="relative mt-0.5 text-[9px] text-white/60">{tile.caption}</p>
                  </motion.div>
                ))}
              </motion.div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-text-secondary">Rasio Kredit vs Debit</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
                  {displayStats.inflowShare}% : {displayStats.outflowShare}%
                </span>
              </div>
            </div>

            <RatioRing percent={displayStats.inflowShare} />
          </div>
        </motion.div>
      </motion.div>

      {/* Riwayat Transaksi */}
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
              <p className="text-sm font-bold text-text-primary">Riwayat Transaksi</p>
              <p className="text-xs text-text-secondary">
                Menampilkan log aktivitas rekening terpilih
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">
              Halaman {page} dari {displayTotalPages}
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
              onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
              disabled={page >= displayTotalPages}
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
          {displayLoading ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-text-secondary">
              <Loader2 size={22} className="animate-spin text-primary" />
              Memuat data mutasi...
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-text-secondary">
              <ClipboardList size={26} className="text-text-muted" />
              Tidak ada riwayat transaksi
            </div>
          ) : (
            displayList.map((trx) => {
              const isSetor = trx.jenisTransaksi === "setor";
              const percent = Math.round((Number(trx.jumlah) / maxAmount) * 100);
              return (
                <motion.div
                  key={trx.id}
                  variants={rowVariants}
                  className="flex flex-col gap-3 p-5 transition-colors hover:bg-background-hover sm:flex-row sm:items-center"
                >
                  <div className="flex shrink-0 items-center gap-3 sm:w-52">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSetor ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {isSetor ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {formatDate(trx.createdAt)}
                      </p>
                      <p className="font-mono text-[11px] text-text-muted">{trx.noTransaksi}</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {isSetor ? "Setor Tunai" : "Tarik Tunai"}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-muted">
                      <Tag size={11} />
                      {trx.keterangan ?? "-"}
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

      {/* Detail modal */}
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
                  Transaksi berhasil & tercatat di sistem
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
