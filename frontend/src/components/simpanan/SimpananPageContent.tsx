"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  AlertCircle,
  Award,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileText,
  Filter,
  HandCoins,
  History,
  Loader2,
  PiggyBank,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import { GradientStatCard } from "@/components/dashboard/GradientStatCard";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import {
  formatCurrency,
  formatDateID,
  formatDateOnlyLongID,
  formatMonthYearID,
} from "@/lib/format";
import { downloadSimpananPdf } from "@/lib/exportPdf";
import type { SimpananRingkasanItem, SimpananWajibHistoryItem } from "@/lib/types";

const SIMPANAN_POKOK_NOMINAL = 500_000;
const SIMPANAN_WAJIB_NOMINAL = 10_000;

const inputClass =
  "w-full rounded-xl border border-border bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-text-secondary";

function currentPeriode(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function periodeLabel(periode: string): string {
  const [year, month] = periode.split("-");
  return formatMonthYearID(new Date(Number(year), Number(month) - 1, 1));
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function SimpananPageContent() {
  const [ringkasan, setRingkasan] = useState<SimpananRingkasanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pokokFilter, setPokokFilter] = useState<"semua" | "sudah" | "belum">("semua");

  const [pokokTarget, setPokokTarget] = useState<SimpananRingkasanItem | null>(null);
  const [pokokSaving, setPokokSaving] = useState(false);

  const [wajibTarget, setWajibTarget] = useState<SimpananRingkasanItem | null>(null);
  const [wajibPeriode, setWajibPeriode] = useState(currentPeriode());
  const [wajibSaving, setWajibSaving] = useState(false);

  const [historyTarget, setHistoryTarget] = useState<SimpananRingkasanItem | null>(null);
  const [historyList, setHistoryList] = useState<SimpananWajibHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  async function loadRingkasan() {
    setLoading(true);
    try {
      const { data } = await api.get<SimpananRingkasanItem[]>("/simpanan");
      setRingkasan(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat data simpanan"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRingkasan();
  }, []);

  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ringkasan
      .filter((r) =>
        q ? r.nama.toLowerCase().includes(q) || r.noRekening.includes(q) : true,
      )
      .filter((r) => {
        if (pokokFilter === "sudah") return r.punyaSimpananPokok;
        if (pokokFilter === "belum") return !r.punyaSimpananPokok;
        return true;
      });
  }, [ringkasan, search, pokokFilter]);

  const stats = useMemo(() => {
    const totalAnggota = ringkasan.length;
    const sudahPokokList = ringkasan.filter((r) => r.punyaSimpananPokok);
    const belumPokokList = ringkasan.filter((r) => !r.punyaSimpananPokok);
    const sudahPokok = sudahPokokList.length;
    const totalPokok = ringkasan.reduce((sum, r) => sum + r.simpananPokok, 0);
    const totalWajib = ringkasan.reduce((sum, r) => sum + r.simpananWajib, 0);
    const totalTerkumpul = totalPokok + totalWajib;
    const pokokProgress = totalAnggota > 0 ? Math.round((sudahPokok / totalAnggota) * 100) : 0;
    const pokokShare = totalTerkumpul > 0 ? Math.round((totalPokok / totalTerkumpul) * 100) : 0;
    const wajibShare = totalTerkumpul > 0 ? 100 - pokokShare : 0;
    const rataWajibPerAnggota = totalAnggota > 0 ? totalWajib / totalAnggota : 0;
    const anggotaTeraktif = [...ringkasan].sort((a, b) => b.jumlah - a.jumlah)[0] ?? null;
    return {
      totalAnggota,
      sudahPokok,
      belumPokokList,
      totalPokok,
      totalWajib,
      totalTerkumpul,
      pokokProgress,
      pokokShare,
      wajibShare,
      rataWajibPerAnggota,
      anggotaTeraktif,
    };
  }, [ringkasan]);

  function openPokok(item: SimpananRingkasanItem) {
    setPokokTarget(item);
  }

  async function submitPokok() {
    if (!pokokTarget) return;
    setPokokSaving(true);
    try {
      await api.post("/simpanan/pokok", { nasabahId: pokokTarget.nasabahId });
      notify.success(`Simpanan pokok ${pokokTarget.nama} berhasil ditambahkan`);
      setPokokTarget(null);
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menambahkan simpanan pokok"));
    } finally {
      setPokokSaving(false);
    }
  }

  function openWajib(item: SimpananRingkasanItem) {
    setWajibTarget(item);
    setWajibPeriode(currentPeriode());
  }

  async function submitWajib(e: React.FormEvent) {
    e.preventDefault();
    if (!wajibTarget) return;
    setWajibSaving(true);
    try {
      await api.post("/simpanan/wajib", {
        nasabahId: wajibTarget.nasabahId,
        periode: wajibPeriode,
      });
      notify.success(`Simpanan wajib ${wajibTarget.nama} berhasil dicatat`);
      setWajibTarget(null);
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menambahkan simpanan wajib"));
    } finally {
      setWajibSaving(false);
    }
  }

  async function openHistory(item: SimpananRingkasanItem) {
    setHistoryTarget(item);
    setHistoryLoading(true);
    try {
      const { data } = await api.get<SimpananWajibHistoryItem[]>(
        `/simpanan/wajib/${item.nasabahId}`,
      );
      setHistoryList(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat riwayat simpanan wajib"));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      await downloadSimpananPdf(
        {
          perTanggalLabel: formatDateOnlyLongID(today),
          tahun: new Date().getFullYear(),
          rows: ringkasan.map((r) => ({
            nama: r.nama,
            simpananPokok: r.simpananPokok,
            simpananWajib: r.simpananWajib,
            jumlah: r.jumlah,
          })),
        },
        `simpanan-pokok-wajib-${today}.pdf`,
      );
      notify.success("Laporan simpanan berhasil diunduh");
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal membuat laporan"));
    } finally {
      setExporting(false);
    }
  }

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
              <HandCoins size={24} />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Koperasi Anggota
              </p>
              <h1 className="text-2xl font-bold text-text-primary">Simpanan Pokok</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <Users size={13} className="text-text-muted" />
                Kelola simpanan pokok &amp; wajib anggota guru
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-12"
      >
        <div className="lg:col-span-3">
          <GradientStatCard
            tone="blue"
            label="Total Anggota Guru"
            value={stats.totalAnggota}
            caption="Terdaftar sebagai anggota koperasi"
            icon={Users}
            secondaryLabel={
              stats.anggotaTeraktif
                ? `Teratas: ${stats.anggotaTeraktif.nama.split(",")[0]}`
                : "Belum ada data"
            }
            secondaryIcon={Award}
          />
        </div>
        <div className="lg:col-span-4">
          <GradientStatCard
            tone="green"
            label="Sudah Simpanan Pokok"
            value={stats.sudahPokok}
            caption={`${stats.pokokProgress}% dari total anggota`}
            icon={CheckCircle2}
            secondaryLabel={`${stats.belumPokokList.length} anggota belum menyetor`}
            secondaryIcon={AlertCircle}
          />
        </div>
        <div className="lg:col-span-2">
          <GradientStatCard
            tone="cyan"
            label="Total Simpanan Pokok"
            value={stats.totalPokok}
            caption={`${stats.pokokShare}% dari total simpanan`}
            icon={PiggyBank}
            secondaryLabel="Rp 500.000 / anggota (tetap)"
            secondaryIcon={Sparkles}
          />
        </div>
        <div className="lg:col-span-3">
          <GradientStatCard
            tone="orange"
            label="Total Simpanan Wajib"
            value={stats.totalWajib}
            caption={`${stats.wajibShare}% dari total simpanan`}
            icon={Coins}
            secondaryLabel={`Rata-rata ${formatCurrency(stats.rataWajibPerAnggota)}/anggota`}
            secondaryIcon={TrendingUp}
          />
        </div>
      </motion.div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-3xl bg-background-card p-4 shadow-soft sm:p-5 lg:col-span-2"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.025] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
          />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-text-primary">
                Daftar Anggota{" "}
                <span className="font-medium text-text-muted">({displayList.length})</span>
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Simpanan pokok &amp; wajib per anggota guru
              </p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau no. rekening..."
                className="w-full rounded-xl border border-transparent bg-background-hover py-2.5 pr-8 pl-9 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-text-muted transition-colors hover:text-danger"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
            <span className="mr-1 flex items-center gap-1 text-[11px] font-semibold text-text-muted">
              <Filter size={11} />
              Status:
            </span>
            {(
              [
                { value: "semua" as const, label: "Semua", icon: Users, count: ringkasan.length },
                {
                  value: "sudah" as const,
                  label: "Sudah Pokok",
                  icon: CheckCircle2,
                  count: stats.sudahPokok,
                },
                {
                  value: "belum" as const,
                  label: "Belum Pokok",
                  icon: AlertCircle,
                  count: stats.belumPokokList.length,
                },
              ]
            ).map((opt) => {
              const active = pokokFilter === opt.value;
              const OptIcon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPokokFilter(opt.value)}
                  className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="pokok-filter-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-primary shadow-sm"
                    />
                  )}
                  <span
                    className={`relative flex items-center gap-1.5 transition-colors ${
                      active ? "text-white" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <OptIcon size={12} />
                    {opt.label}
                    <span
                      className={`rounded-full px-1.5 text-[10px] ${
                        active ? "bg-white/20" : "bg-background-hover"
                      }`}
                    >
                      {opt.count}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[14px_14px]"
          />
          <div className="relative flex items-center gap-2.5">
            <motion.span
              initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
            >
              <FileText size={18} />
            </motion.span>
            <div>
              <p className="text-sm font-bold text-text-primary">Unduh Laporan PDF</p>
              <p className="text-[11px] text-text-secondary">
                Ekspor {ringkasan.length} anggota ke file .pdf
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={exporting}
            onClick={handleExport}
            className="relative mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-primary to-primary-dark px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? "Menyiapkan..." : "Unduh PDF"}
          </motion.button>
          <p className="relative mt-3 flex items-center gap-1.5 text-[10px] text-text-muted">
            <Download size={11} className="shrink-0 text-primary" />
            Klik untuk langsung mengunduh laporan sesuai data terkini
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="overflow-hidden rounded-3xl bg-background-card shadow-soft"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background-hover">
              <tr>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  No
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Nama Anggota
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Simpanan Pokok
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Simpanan Wajib
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jumlah
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="visible" variants={listVariants}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Loader2 size={22} className="animate-spin text-primary" />
                      Memuat data simpanan...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <PiggyBank size={26} className="text-text-muted" />
                      Tidak ada data anggota guru
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map((item, index) => (
                  <motion.tr
                    key={item.nasabahId}
                    variants={rowVariants}
                    className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                  >
                    <td className="px-4 py-3 text-text-secondary">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {item.nama.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{item.nama}</p>
                          <p className="font-mono text-xs text-text-muted">{item.noRekening}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.punyaSimpananPokok ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                          <CheckCircle2 size={12} />
                          {formatCurrency(item.simpananPokok)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-background-hover px-2.5 py-1 text-xs font-medium text-text-muted">
                          Belum ada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openHistory(item)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                        title="Lihat riwayat setoran"
                      >
                        {formatCurrency(item.simpananWajib)}
                        <History size={11} />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-bold text-text-primary">
                      {formatCurrency(item.jumlah)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <motion.button
                          whileHover={item.punyaSimpananPokok ? undefined : { scale: 1.05 }}
                          whileTap={item.punyaSimpananPokok ? undefined : { scale: 0.92 }}
                          onClick={() => openPokok(item)}
                          disabled={item.punyaSimpananPokok}
                          title={
                            item.punyaSimpananPokok
                              ? "Simpanan pokok sudah tercatat"
                              : "Tambah simpanan pokok"
                          }
                          className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-background-hover disabled:text-text-muted disabled:shadow-none"
                        >
                          <Plus size={12} />
                          Pokok
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => openWajib(item)}
                          className="flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-success/90"
                        >
                          <Plus size={12} />
                          Wajib
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {pokokTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPokokTarget(null)}
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
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
                  >
                    <HandCoins size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Simpanan Pokok</h2>
                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                      <Sparkles size={11} className="text-primary" />
                      Setoran satu kali keanggotaan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPokokTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-4 flex items-center gap-2.5 rounded-2xl bg-background-hover p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {pokokTarget.nama.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {pokokTarget.nama}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    {pokokTarget.noRekening}
                  </p>
                </div>
              </div>

              <div className="relative mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary-dark p-5 text-center text-white">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[12px_12px]"
                />
                <span className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <PiggyBank size={18} />
                </span>
                <p className="relative mt-2.5 text-xs text-white/75">Nominal Simpanan Pokok</p>
                <p className="relative mt-1 text-3xl font-bold">
                  {formatCurrency(SIMPANAN_POKOK_NOMINAL)}
                </p>
                <span className="relative mt-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
                  <CheckCircle2 size={10} />
                  Nominal tetap untuk semua anggota
                </span>
              </div>

              <p className="relative mb-5 flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-[11px] text-warning">
                <AlertCircle size={13} className="shrink-0" />
                Simpanan pokok hanya dapat dicatat satu kali per anggota dan tidak dapat diubah
                setelah disimpan.
              </p>

              <div className="relative flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPokokTarget(null)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                >
                  Batal
                </button>
                <motion.button
                  type="button"
                  disabled={pokokSaving}
                  onClick={submitPokok}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {pokokSaving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Simpan
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {wajibTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setWajibTarget(null)}
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
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(34,197,94,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-success/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-gradient-green-from to-gradient-green-to text-white shadow-sm"
                  >
                    <Coins size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Simpanan Wajib</h2>
                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                      <TrendingUp size={11} className="text-success" />
                      Setoran rutin, dapat berkali-kali
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWajibTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-4 flex items-center gap-2.5 rounded-2xl bg-background-hover p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                  {wajibTarget.nama.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {wajibTarget.nama}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    {wajibTarget.noRekening}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-text-muted">Terkumpul</p>
                  <p className="text-xs font-bold text-success">
                    {formatCurrency(wajibTarget.simpananWajib)}
                  </p>
                </div>
              </div>

              <form onSubmit={submitWajib} className="relative flex flex-col gap-4">
                <div className="relative">
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-success" />
                      Periode
                    </span>
                  </label>
                  <input
                    type="month"
                    required
                    value={wajibPeriode}
                    onChange={(e) => setWajibPeriode(e.target.value)}
                    className="peer absolute inset-x-0 bottom-0 top-6 z-10 h-[calc(100%-1.5rem)] w-full cursor-pointer opacity-0"
                  />
                  <div
                    className={`${inputClass} pointer-events-none flex items-center justify-between`}
                  >
                    <span className={wajibPeriode ? "" : "text-text-muted"}>
                      {wajibPeriode
                        ? formatMonthYearID(new Date(`${wajibPeriode}-01`))
                        : "Pilih bulan"}
                    </span>
                    <Clock size={13} className="shrink-0 text-text-muted" />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-gradient-green-from to-gradient-green-to p-4 text-center text-white">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[12px_12px]"
                  />
                  <span className="relative mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                    <Coins size={16} />
                  </span>
                  <p className="relative mt-2 text-xs text-white/75">Nominal Setoran per Bulan</p>
                  <p className="relative mt-1 text-2xl font-bold">
                    {formatCurrency(SIMPANAN_WAJIB_NOMINAL)}
                  </p>
                  <span className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold">
                    <CheckCircle2 size={10} />
                    Nominal tetap, tidak dapat diubah
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-success/5 px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <Banknote size={13} className="text-success" />
                    Total wajib setelah setoran ini
                  </span>
                  <span className="font-bold text-success">
                    {formatCurrency(wajibTarget.simpananWajib + SIMPANAN_WAJIB_NOMINAL)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setWajibTarget(null)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={wajibSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-success/90 disabled:opacity-60"
                  >
                    {wajibSaving && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Simpan Setoran
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHistoryTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="scrollbar-hide relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-background-card p-6 shadow-soft"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
              />

              <div className="relative mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                  >
                    <History size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Riwayat Simpanan Wajib</h2>
                    <p className="truncate text-xs text-text-secondary">{historyTarget.nama}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-5 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 rounded-xl bg-success/10 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                    <Coins size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {formatCurrency(historyTarget.simpananWajib)}
                    </p>
                    <p className="truncate text-[10px] text-text-muted">Total Terkumpul</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <History size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {historyList.length}
                    </p>
                    <p className="truncate text-[10px] text-text-muted">Jumlah Setoran</p>
                  </div>
                </div>
              </div>

              {historyLoading ? (
                <div className="relative flex flex-col items-center gap-2 py-10 text-text-secondary">
                  <Loader2 size={22} className="animate-spin text-primary" />
                  Memuat riwayat...
                </div>
              ) : historyList.length === 0 ? (
                <div className="relative flex flex-col items-center gap-2 py-10 text-center text-text-secondary">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background-hover">
                    <Coins size={20} className="text-text-muted" />
                  </span>
                  <p className="text-sm font-semibold">Belum ada setoran simpanan wajib</p>
                  <p className="text-[11px] text-text-muted">
                    Riwayat akan muncul di sini setelah setoran pertama dicatat
                  </p>
                </div>
              ) : (
                <div className="relative flex flex-col gap-2 border-l-2 border-dashed border-border pl-4">
                  {historyList.map((h, i) => (
                    <div key={h.id} className="relative">
                      <span
                        className={`absolute top-4 -left-[22.5px] h-3 w-3 rounded-full ring-4 ring-background-card ${
                          i === 0 ? "bg-success" : "bg-border"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-background-hover px-3.5 py-3 transition-colors hover:bg-background-hover/70">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                            <Banknote size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary">
                              {formatCurrency(h.nominal)}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary">
                              <Wallet size={10} />
                              Periode {periodeLabel(h.periode)}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                              <Clock size={10} />
                              {formatDateID(h.tanggalSetor)} &middot; oleh {h.processedBy}
                            </p>
                          </div>
                        </div>
                        {i === 0 && (
                          <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">
                            Terbaru
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}
