"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  AlertTriangle,
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
  Pencil,
  Printer,
  Receipt,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import { RatioRing } from "@/components/RatioRing";
import { KuitansiModal } from "@/components/transaksi/KuitansiModal";
import { useNasabahLookup } from "@/hooks/useNasabahLookup";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDateID, formatDateOnlyID, formatDigitsID } from "@/lib/format";
import { effectiveStaffId, effectiveStaffRole } from "@/lib/role";
import { JENIS_ICON, jenisLabel } from "@/lib/transaksiMeta";
import { useAuthStore } from "@/store/authStore";
import type { Nasabah, Transaksi } from "@/lib/types";

const PAGE_SIZE = 8;

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

export function MutasiPageContent() {
  const noRekeningRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const staffRole = effectiveStaffRole(user);
  const staffId = effectiveStaffId(user);
  const isAdminTier = staffRole === "admin" || staffRole === "superadmin";
  const {
    noRekening,
    setNoRekening,
    nasabah,
    searching,
    suggestions,
    suggestionsLoading,
    selectSuggestion,
    handleSearch: handleLookupSearch,
  } = useNasabahLookup();
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [mutasi, setMutasi] = useState<Transaksi[]>([]);
  const [loadingMutasi, setLoadingMutasi] = useState(false);
  const [globalTransaksi, setGlobalTransaksi] = useState<Transaksi[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<Transaksi | null>(null);
  const [kuitansiTrx, setKuitansiTrx] = useState<Transaksi | null>(null);
  const [kuitansiNasabah, setKuitansiNasabah] = useState<Nasabah | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editTarget, setEditTarget] = useState<Transaksi | null>(null);
  const [editJumlah, setEditJumlah] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function canModify(trx: Transaksi): boolean {
    if (isAdminTier) return true;
    if (staffRole === "teller" || staffRole === "co_teller") {
      return trx.processedById === staffId;
    }
    return false;
  }

  function openEdit(trx: Transaksi) {
    setEditTarget(trx);
    setEditJumlah(String(Math.round(Number(trx.jumlah))));
    setEditKeterangan(trx.keterangan ?? "");
  }

  function closeEdit() {
    setEditTarget(null);
    setEditJumlah("");
    setEditKeterangan("");
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    const jumlahNumber = Number(editJumlah) || 0;
    if (jumlahNumber <= 0) {
      notify.error("Jumlah harus lebih dari 0");
      return;
    }
    setEditSaving(true);
    try {
      await api.patch(`/transaksi/${editTarget.id}`, {
        jumlah: jumlahNumber,
        keterangan: editKeterangan.trim() || undefined,
      });
      notify.success(`Transaksi ${editTarget.noTransaksi} berhasil diperbarui`);
      closeEdit();
      setRefreshKey((k) => k + 1);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memperbarui transaksi"));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(trx: Transaksi) {
    if (
      !confirm(
        `Hapus transaksi ${trx.noTransaksi} (${trx.jenisTransaksi} ${formatCurrency(trx.jumlah)})? Saldo nasabah akan disesuaikan kembali.`,
      )
    ) {
      return;
    }
    setDeletingId(trx.id);
    try {
      await api.delete(`/transaksi/${trx.id}`);
      notify.success(`Transaksi ${trx.noTransaksi} berhasil dihapus`);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menghapus transaksi"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    setMutasi([]);
    await handleLookupSearch(e);
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
        notify.error(getErrorMessage(error, "Gagal memuat mutasi transaksi"));
      } finally {
        setLoadingMutasi(false);
      }
    }
    loadMutasi();
  }, [nasabah, from, to, refreshKey]);

  useEffect(() => {
    if (nasabah) return;
    let cancelled = false;
    async function loadGlobal() {
      setLoadingGlobal(true);
      try {
        const { data } = await api.get<Transaksi[]>("/transaksi", {
          params: { from: from || undefined, to: to || undefined, limit: 100 },
        });
        if (!cancelled) {
          setGlobalTransaksi(data);
          setPage(1);
        }
      } catch (error) {
        if (!cancelled) {
          notify.error(getErrorMessage(error, "Gagal memuat transaksi terbaru"));
        }
      } finally {
        if (!cancelled) setLoadingGlobal(false);
      }
    }
    loadGlobal();
    return () => {
      cancelled = true;
    };
  }, [nasabah, from, to, refreshKey]);

  function computeStats(list: Transaksi[]) {
    const totalInflow = list
      .filter((t) => t.jenisTransaksi === "setor")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);
    const totalOutflow = list
      .filter((t) => t.jenisTransaksi === "tarik")
      .reduce((sum, t) => sum + Number(t.jumlah), 0);
    const setorCount = list.filter((t) => t.jenisTransaksi === "setor").length;
    const tarikCount = list.filter((t) => t.jenisTransaksi === "tarik").length;
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
  }

  const stats = useMemo(() => computeStats(mutasi), [mutasi]);
  const globalStats = useMemo(() => computeStats(globalTransaksi), [globalTransaksi]);

  const totalPages = Math.max(1, Math.ceil(mutasi.length / PAGE_SIZE));
  const pagedMutasi = mutasi.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const globalTotalPages = Math.max(1, Math.ceil(globalTransaksi.length / PAGE_SIZE));
  const pagedGlobal = globalTransaksi.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const displayStats = nasabah ? stats : globalStats;
  const displayList = nasabah ? pagedMutasi : pagedGlobal;
  const displayTotalPages = nasabah ? totalPages : globalTotalPages;
  const displayLoading = nasabah ? loadingMutasi : loadingGlobal;
  const displayCount = nasabah ? mutasi.length : globalTransaksi.length;

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
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

          {nasabah ? (
            <>
              <div className="relative flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold backdrop-blur-sm"
                >
                  {nasabah.nama.slice(0, 2).toUpperCase()}
                </motion.span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{nasabah.nama}</p>
                  <p className="flex items-center gap-1 font-mono text-xs text-white/70">
                    <Hash size={11} />
                    {nasabah.noRekening}
                  </p>
                </div>
              </div>

              <div className="relative mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                  <Wallet size={11} />
                  Saldo Saat Ini
                </p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(nasabah.saldo)}</p>
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
            </>
          ) : (
            <>
              <div className="relative flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <ClipboardList size={24} />
                </motion.span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">Transaksi Terbaru</p>
                  <p className="text-xs text-white/70">Seluruh nasabah, real-time</p>
                </div>
              </div>

              <div className="relative mt-5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                  <ClipboardList size={11} />
                  Total Ditampilkan
                </p>
                <p className="mt-1 text-2xl font-bold">{globalTransaksi.length} transaksi</p>
              </div>

              <p className="relative mt-4 text-xs text-white/70">
                Cari nasabah tertentu di kartu sebelah untuk melihat riwayat &amp; saldo
                rekeningnya, atau langsung buka kuitansi dari transaksi terbaru di tabel bawah.
              </p>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => noRekeningRef.current?.focus()}
                className="relative mt-4 flex w-fit items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm"
              >
                <Search size={16} />
                Cari Nasabah
              </motion.button>
            </>
          )}
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="relative overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft lg:col-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
          />

          <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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

            {nasabah && (
              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={exportCsv}
                  className="flex items-center gap-1.5 rounded-xl bg-background-hover px-3.5 py-2 text-xs font-bold text-text-secondary transition-colors hover:text-primary"
                >
                  <Download size={13} />
                  Export CSV
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                >
                  <Printer size={13} />
                  Cetak
                </motion.button>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSearch}
            className="relative mb-5 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1.2fr_1fr_1fr_auto]"
          >
            <div className="relative">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Building2 size={12} className="text-primary" />
                No Rekening / Nama
              </label>
              <input
                ref={noRekeningRef}
                type="text"
                value={noRekening}
                onChange={(e) => setNoRekening(e.target.value)}
                placeholder="Contoh: 0981223445 atau nama nasabah"
                autoComplete="off"
                className={inputClass}
              />

              <AnimatePresence>
                {!nasabah && (suggestions.length > 0 || suggestionsLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-border bg-background-card shadow-soft"
                  >
                    {suggestionsLoading ? (
                      <div className="flex items-center gap-2 px-3 py-3 text-xs text-text-secondary">
                        <Loader2 size={13} className="animate-spin text-primary" />
                        Mencari nasabah...
                      </div>
                    ) : (
                      suggestions.map((item) => {
                        const Icon = JENIS_ICON[item.jenisNasabah];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectSuggestion(item)}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-background-hover"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon size={14} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-text-primary">
                                {item.nama}
                              </span>
                              <span className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
                                {item.noRekening}
                                <span className="text-text-muted/60">&middot;</span>
                                {jenisLabel[item.jenisNasabah]}
                              </span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={12} className="text-primary" />
                Dari Tanggal
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="peer absolute inset-0 top-6 z-10 h-[calc(100%-1.5rem)] w-full cursor-pointer opacity-0"
              />
              <div
                className={`${inputClass} pointer-events-none flex items-center justify-between`}
              >
                <span className={from ? "" : "text-text-muted"}>
                  {from ? formatDateOnlyID(from) : "Pilih tanggal"}
                </span>
                <Calendar size={13} className="shrink-0 text-text-muted" />
              </div>
            </div>
            <div className="relative">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={12} className="text-primary" />
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="peer absolute inset-0 top-6 z-10 h-[calc(100%-1.5rem)] w-full cursor-pointer opacity-0"
              />
              <div
                className={`${inputClass} pointer-events-none flex items-center justify-between`}
              >
                <span className={to ? "" : "text-text-muted"}>
                  {to ? formatDateOnlyID(to) : "Pilih tanggal"}
                </span>
                <Calendar size={13} className="shrink-0 text-text-muted" />
              </div>
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

          {(from || to) && (
            <div className="relative -mt-3 mb-5 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={12} className="text-primary" />
                Periode: {from ? formatDateOnlyID(from) : "-"}
                {" — "}
                {to ? formatDateOnlyID(to) : "-"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFrom("");
                  setTo("");
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-primary"
              >
                <X size={12} />
                Tampilkan semua riwayat
              </button>
            </div>
          )}

          <div className="relative flex flex-col gap-6 border-t border-border pt-5 md:flex-row md:items-center md:justify-between">
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
                    <div className="relative flex items-center gap-2.5">
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm"
                      >
                        <tile.icon size={14} />
                      </motion.span>
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="text-xl font-bold">{tile.value}</p>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-[10px] font-semibold text-white/85">{tile.label}</p>
                          <p className="truncate text-[9px] text-white/60">{tile.caption}</p>
                        </div>
                      </div>
                    </div>
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
                {nasabah
                  ? "Menampilkan log aktivitas rekening terpilih"
                  : "Transaksi terbaru dari seluruh nasabah"}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background-hover">
              <tr>
                {!nasabah && (
                  <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                    Nasabah
                  </th>
                )}
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jenis
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  No Transaksi
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Keterangan
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jumlah
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Saldo Sesudah
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
            >
              {displayLoading ? (
                <tr>
                  <td colSpan={nasabah ? 7 : 8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Loader2 size={22} className="animate-spin text-primary" />
                      Memuat data mutasi...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={nasabah ? 7 : 8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <ClipboardList size={26} className="text-text-muted" />
                      Tidak ada riwayat transaksi
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map((trx) => {
                  const isSetor = trx.jenisTransaksi === "setor";
                  return (
                    <motion.tr
                      key={trx.id}
                      variants={rowVariants}
                      className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                    >
                      {!nasabah && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                              {(trx.nasabah?.nama ?? "-").slice(0, 2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-text-primary">
                                {trx.nasabah?.nama ?? "-"}
                              </p>
                              <p className="truncate font-mono text-[10px] text-text-muted">
                                {trx.nasabah?.noRekening ?? "-"}
                              </p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isSetor ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                          }`}
                        >
                          {isSetor ? <ArrowDownToLine size={12} /> : <ArrowUpFromLine size={12} />}
                          {isSetor ? "Setor" : "Tarik"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                        {trx.noTransaksi}
                      </td>
                      <td
                        className="max-w-40 truncate px-4 py-3 text-xs text-text-secondary"
                        title={trx.keterangan ?? undefined}
                      >
                        {trx.keterangan ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {formatDateID(trx.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${isSetor ? "text-success" : "text-danger"}`}>
                          {isSetor ? "+" : "-"}
                          {formatCurrency(trx.jumlah)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {formatCurrency(trx.saldoSesudah)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setViewing(trx)}
                            className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                          >
                            <Eye size={12} />
                            Detail
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => {
                              const rowNasabah = trx.nasabah ?? nasabah;
                              if (!rowNasabah) {
                                notify.error("Data nasabah untuk transaksi ini tidak ditemukan");
                                return;
                              }
                              setKuitansiNasabah(rowNasabah);
                              setKuitansiTrx(trx);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-background-hover px-2.5 py-1.5 text-xs font-bold text-text-secondary transition-colors hover:text-text-primary"
                          >
                            <Receipt size={12} />
                            Kuitansi
                          </motion.button>
                          {canModify(trx) && (
                            <>
                              <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() => openEdit(trx)}
                                className="flex items-center gap-1 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs font-bold text-warning transition-colors hover:bg-warning/20"
                              >
                                <Pencil size={12} />
                                Edit
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleDelete(trx)}
                                disabled={deletingId === trx.id}
                                className="flex items-center gap-1 rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
                              >
                                {deletingId === trx.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                                Hapus
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
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
                {viewing.nasabah && (
                  <div className="rounded-2xl border border-border p-3">
                    <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                      <Building2 size={10} /> Nasabah
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-text-primary">
                      {viewing.nasabah.nama}
                    </p>
                    <p className="font-mono text-xs text-text-muted">
                      {viewing.nasabah.noRekening}
                    </p>
                  </div>
                )}
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
                      {formatDateID(viewing.createdAt)}
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

      <AnimatePresence>
        {editTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEdit}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(245,158,11,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-warning/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning text-white shadow-sm">
                    <Pencil size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Edit Transaksi</h2>
                    <p className="font-mono text-xs text-text-secondary">
                      {editTarget.noTransaksi}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-4 flex items-center gap-2.5 rounded-2xl bg-background-hover p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(editTarget.nasabah?.nama ?? nasabah?.nama ?? "-").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {editTarget.nasabah?.nama ?? nasabah?.nama ?? "-"}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    {editTarget.nasabah?.noRekening ?? nasabah?.noRekening ?? "-"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    editTarget.jenisTransaksi === "setor"
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {editTarget.jenisTransaksi === "setor" ? "Setor" : "Tarik"}
                </span>
              </div>

              <form onSubmit={submitEdit} className="relative flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background-hover px-3 py-2.5 transition-colors focus-within:border-warning">
                    <span className="text-sm font-bold text-text-muted">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formatDigitsID(editJumlah)}
                      onChange={(e) => setEditJumlah(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-full min-w-0 bg-transparent text-sm font-bold text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                    placeholder="Misal: Setoran tabungan..."
                    className={inputClass}
                  />
                </div>

                <p className="flex items-start gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-[11px] text-warning">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Mengubah jumlah akan menghitung ulang saldo transaksi ini dan seluruh transaksi
                  nasabah setelahnya.
                </p>

                <div className="mt-1 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={editSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-warning px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-warning/90 disabled:opacity-60"
                  >
                    {editSaving && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Simpan Perubahan
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <KuitansiModal
        transaksi={kuitansiTrx}
        nasabah={kuitansiNasabah}
        tellerNama={kuitansiTrx?.processedBy?.nama ?? "-"}
        onClose={() => {
          setKuitansiTrx(null);
          setKuitansiNasabah(null);
        }}
      />
    </Layout>
  );
}
