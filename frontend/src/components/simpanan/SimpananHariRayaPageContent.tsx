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
  Gift,
  History,
  Loader2,
  Lock,
  PartyPopper,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
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
  formatDigitsID,
  formatMonthYearID,
} from "@/lib/format";
import { downloadSimpananHariRayaPdf } from "@/lib/exportPdf";
import type { SimpananHariRayaHistoryItem, SimpananHariRayaRingkasanItem } from "@/lib/types";

const QUICK_AMOUNTS = [100_000, 150_000, 200_000, 250_000];

const inputClass =
  "w-full rounded-xl border border-border bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";
const labelClass = "mb-1.5 block text-xs font-semibold text-text-secondary";

function currentPeriode(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function SimpananHariRayaPageContent() {
  const [ringkasan, setRingkasan] = useState<SimpananHariRayaRingkasanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [siapFilter, setSiapFilter] = useState<"semua" | "siap" | "belum">("semua");

  const [daftarTarget, setDaftarTarget] = useState<SimpananHariRayaRingkasanItem | null>(null);
  const [daftarNominal, setDaftarNominal] = useState("");
  const [daftarSaving, setDaftarSaving] = useState(false);

  const [setorTarget, setSetorTarget] = useState<SimpananHariRayaRingkasanItem | null>(null);
  const [setorPeriode, setSetorPeriode] = useState(currentPeriode());
  const [setorSaving, setSetorSaving] = useState(false);

  const [cairkanTarget, setCairkanTarget] = useState<SimpananHariRayaRingkasanItem | null>(null);
  const [cairkanSaving, setCairkanSaving] = useState(false);

  const [historyTarget, setHistoryTarget] = useState<SimpananHariRayaRingkasanItem | null>(null);
  const [historyList, setHistoryList] = useState<SimpananHariRayaHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  async function loadRingkasan() {
    setLoading(true);
    try {
      const { data } = await api.get<SimpananHariRayaRingkasanItem[]>("/simpanan/hari-raya");
      setRingkasan(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat data simpanan hari raya"));
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
        if (siapFilter === "siap") return r.progress >= 100;
        if (siapFilter === "belum") return r.progress < 100;
        return true;
      });
  }, [ringkasan, search, siapFilter]);

  const stats = useMemo(() => {
    const totalAnggota = ringkasan.length;
    const totalTerkumpul = ringkasan.reduce((sum, r) => sum + r.totalTerkumpul, 0);
    const siapCairList = ringkasan.filter((r) => r.progress >= 100);
    const pernahCairList = ringkasan.filter((r) => r.lastPencairan);
    const rataRataProgress =
      totalAnggota > 0
        ? Math.round(ringkasan.reduce((sum, r) => sum + r.progress, 0) / totalAnggota)
        : 0;
    const anggotaTeraktif = [...ringkasan].sort((a, b) => b.totalTerkumpul - a.totalTerkumpul)[0] ?? null;
    return {
      totalAnggota,
      totalTerkumpul,
      siapCairCount: siapCairList.length,
      pernahCairCount: pernahCairList.length,
      rataRataProgress,
      anggotaTeraktif,
    };
  }, [ringkasan]);

  function openDaftar(item: SimpananHariRayaRingkasanItem) {
    setDaftarTarget(item);
    setDaftarNominal("");
  }

  async function submitDaftar(e: React.FormEvent) {
    e.preventDefault();
    if (!daftarTarget) return;
    const nominalNumber = Number(daftarNominal) || 0;
    if (nominalNumber <= 0) {
      notify.error("Nominal setoran harus lebih dari 0");
      return;
    }
    setDaftarSaving(true);
    try {
      await api.post("/simpanan/hari-raya/anggota", {
        nasabahId: daftarTarget.nasabahId,
        nominal: nominalNumber,
      });
      notify.success(`${daftarTarget.nama} berhasil didaftarkan sebagai anggota`);
      setDaftarTarget(null);
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal mendaftarkan anggota"));
    } finally {
      setDaftarSaving(false);
    }
  }

  function openSetor(item: SimpananHariRayaRingkasanItem) {
    setSetorTarget(item);
    setSetorPeriode(currentPeriode());
  }

  async function submitSetor(e: React.FormEvent) {
    e.preventDefault();
    if (!setorTarget) return;
    setSetorSaving(true);
    try {
      await api.post("/simpanan/hari-raya", {
        nasabahId: setorTarget.nasabahId,
        periode: setorPeriode,
      });
      notify.success(`Setoran hari raya ${setorTarget.nama} berhasil dicatat`);
      setSetorTarget(null);
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal menambahkan setoran hari raya"));
    } finally {
      setSetorSaving(false);
    }
  }

  async function submitCairkan() {
    if (!cairkanTarget) return;
    setCairkanSaving(true);
    try {
      await api.post("/simpanan/hari-raya/cairkan", { nasabahId: cairkanTarget.nasabahId });
      notify.success(`Simpanan hari raya ${cairkanTarget.nama} berhasil dicairkan`);
      setCairkanTarget(null);
      loadRingkasan();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal mencairkan simpanan hari raya"));
    } finally {
      setCairkanSaving(false);
    }
  }

  async function openHistory(item: SimpananHariRayaRingkasanItem) {
    setHistoryTarget(item);
    setHistoryLoading(true);
    try {
      const { data } = await api.get<SimpananHariRayaHistoryItem[]>(
        `/simpanan/hari-raya/${item.nasabahId}`,
      );
      setHistoryList(data);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat riwayat setoran"));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      await downloadSimpananHariRayaPdf(
        {
          perTanggalLabel: formatDateOnlyLongID(today),
          rows: ringkasan.map((r) => ({
            nama: r.nama,
            jumlahSetoran: r.jumlahSetoran,
            target: r.target,
            totalTerkumpul: r.totalTerkumpul,
            lastPencairanJumlah: r.lastPencairan?.jumlah ?? 0,
            lastPencairanTanggalLabel: r.lastPencairan
              ? formatDateID(r.lastPencairan.tanggal)
              : "",
          })),
        },
        `simpanan-hari-raya-${today}.pdf`,
      );
      notify.success("Laporan simpanan hari raya berhasil diunduh");
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
              <Gift size={24} />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                Koperasi Anggota
              </p>
              <h1 className="text-2xl font-bold text-text-primary">Simpanan Hari Raya</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <Users size={13} className="text-text-muted" />
                Setoran bebas anggota guru, dicairkan menjelang Idul Fitri
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
            label="Total Terkumpul (Siklus Berjalan)"
            value={stats.totalTerkumpul}
            caption={`Rata-rata progress ${stats.rataRataProgress}%`}
            icon={Coins}
            secondaryLabel={`${stats.siapCairCount} anggota sudah genap 10 bulan`}
            secondaryIcon={CheckCircle2}
          />
        </div>
        <div className="lg:col-span-2">
          <GradientStatCard
            tone="cyan"
            label="Siap Dicairkan"
            value={stats.siapCairCount}
            caption="Sudah 10 dari 10 bulan"
            icon={PartyPopper}
            secondaryLabel="Target 10x setoran"
            secondaryIcon={Sparkles}
          />
        </div>
        <div className="lg:col-span-3">
          <GradientStatCard
            tone="orange"
            label="Pernah Mencairkan"
            value={stats.pernahCairCount}
            caption="Riwayat pencairan tercatat"
            icon={History}
            secondaryLabel="Siklus baru otomatis dimulai"
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
                Progress setoran hari raya per anggota guru
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
                { value: "semua" as const, label: "Semua", icon: Users },
                { value: "siap" as const, label: "Siap Cair", icon: PartyPopper },
                { value: "belum" as const, label: "Belum Genap 10 Bulan", icon: Clock },
              ]
            ).map((opt) => {
              const active = siapFilter === opt.value;
              const OptIcon = opt.icon;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSiapFilter(opt.value)}
                  className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
                >
                  {active && (
                    <motion.span
                      layoutId="hari-raya-filter-pill"
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
                  Progress
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Total Terkumpul
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Pencairan Terakhir
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
                      Memuat data simpanan hari raya...
                    </div>
                  </td>
                </tr>
              ) : displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Gift size={26} className="text-text-muted" />
                      Tidak ada data anggota guru
                    </div>
                  </td>
                </tr>
              ) : (
                displayList.map((item, index) => {
                  const siap = item.progress >= 100;
                  return (
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
                        {item.nominalPerBulan === null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-background-hover px-2.5 py-1 text-xs font-medium text-text-muted">
                            Belum Terdaftar
                          </span>
                        ) : (
                          <div className="w-32">
                            <div className="mb-1 flex items-center justify-between text-[11px]">
                              <span
                                className={`font-bold ${siap ? "text-success" : "text-text-secondary"}`}
                              >
                                {item.jumlahSetoran}/{item.target} bulan
                              </span>
                              {siap && <PartyPopper size={11} className="text-success" />}
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background-hover">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className={`h-full rounded-full ${siap ? "bg-success" : "bg-primary"}`}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openHistory(item)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                          title="Lihat riwayat setoran"
                        >
                          {formatCurrency(item.totalTerkumpul)}
                          <History size={11} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {item.lastPencairan ? (
                          <div>
                            <p className="font-semibold text-text-primary">
                              {formatCurrency(item.lastPencairan.jumlah)}
                            </p>
                            <p className="text-[11px] text-text-muted">
                              {formatDateID(item.lastPencairan.tanggal)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-muted">Belum pernah</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {item.nominalPerBulan === null ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => openDaftar(item)}
                              className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                            >
                              <UserPlus size={12} />
                              Tambah Anggota
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.92 }}
                              onClick={() => openSetor(item)}
                              className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                            >
                              <Plus size={12} />
                              Setor
                            </motion.button>
                          )}
                          <motion.button
                            whileHover={item.totalTerkumpul > 0 ? { scale: 1.05 } : undefined}
                            whileTap={item.totalTerkumpul > 0 ? { scale: 0.92 } : undefined}
                            onClick={() => setCairkanTarget(item)}
                            disabled={item.totalTerkumpul <= 0}
                            title={
                              item.totalTerkumpul <= 0
                                ? "Belum ada setoran untuk dicairkan"
                                : "Cairkan simpanan hari raya"
                            }
                            className="flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:bg-background-hover disabled:text-text-muted disabled:shadow-none"
                          >
                            <Gift size={12} />
                            Cairkan
                          </motion.button>
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
        {daftarTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDaftarTarget(null)}
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
                    <UserPlus size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Tambah Anggota</h2>
                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                      <Sparkles size={11} className="text-primary" />
                      Tentukan nominal bulanan, target 10 bulan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDaftarTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-4 flex items-center gap-2.5 rounded-2xl bg-background-hover p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {daftarTarget.nama.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {daftarTarget.nama}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    {daftarTarget.noRekening}
                  </p>
                </div>
              </div>

              <form onSubmit={submitDaftar} className="relative flex flex-col gap-4">
                <div>
                  <label className={labelClass}>Nominal Setoran / Bulan</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background-hover px-3 py-2.5 transition-colors focus-within:border-primary">
                    <span className="text-sm font-bold text-text-muted">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      autoFocus
                      value={formatDigitsID(daftarNominal)}
                      onChange={(e) => setDaftarNominal(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-full min-w-0 bg-transparent text-sm font-bold text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setDaftarNominal(String(amount))}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                          Number(daftarNominal) === amount
                            ? "bg-primary text-white"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        }`}
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted">
                    <AlertCircle size={10} />
                    Nominal bebas, tapi akan dikunci untuk seluruh setoran di siklus ini.
                  </p>
                </div>

                {Number(daftarNominal) > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs">
                    <span className="flex items-center gap-1.5 text-text-secondary">
                      <Banknote size={13} className="text-primary" />
                      Target 10 bulan
                    </span>
                    <span className="font-bold text-primary">
                      {formatCurrency((Number(daftarNominal) || 0) * 10)}
                    </span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setDaftarTarget(null)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={daftarSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {daftarSaving && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Daftarkan Anggota
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {setorTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSetorTarget(null)}
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
                    <Gift size={20} />
                  </motion.span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Setor Hari Raya</h2>
                    <p className="flex items-center gap-1 text-xs text-text-secondary">
                      <Lock size={11} className="text-primary" />
                      Nominal tetap, target 10 bulan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSetorTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative mb-4 flex items-center gap-2.5 rounded-2xl bg-background-hover p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {setorTarget.nama.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {setorTarget.nama}
                  </p>
                  <p className="font-mono text-[11px] text-text-muted">
                    {setorTarget.noRekening}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-text-muted">
                    Progress {setorTarget.jumlahSetoran}/{setorTarget.target}
                  </p>
                  <p className="text-xs font-bold text-primary">
                    {formatCurrency(setorTarget.totalTerkumpul)}
                  </p>
                </div>
              </div>

              <form onSubmit={submitSetor} className="relative flex flex-col gap-4">
                <div className="relative">
                  <label className={labelClass}>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} className="text-primary" />
                      Periode
                    </span>
                  </label>
                  <input
                    type="month"
                    required
                    value={setorPeriode}
                    onChange={(e) => setSetorPeriode(e.target.value)}
                    className="peer absolute inset-x-0 bottom-0 top-6 z-10 h-[calc(100%-1.5rem)] w-full cursor-pointer opacity-0"
                  />
                  <div
                    className={`${inputClass} pointer-events-none flex items-center justify-between`}
                  >
                    <span className={setorPeriode ? "" : "text-text-muted"}>
                      {setorPeriode
                        ? formatMonthYearID(new Date(`${setorPeriode}-01`))
                        : "Pilih bulan"}
                    </span>
                    <Clock size={13} className="shrink-0 text-text-muted" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nominal Setoran</label>
                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(setorTarget.nominalPerBulan ?? 0)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                      <Lock size={10} />
                      Tetap
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-text-muted">
                    <Lock size={10} />
                    Nominal dikunci sesuai pendaftaran anggota, tidak bisa diubah.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    <Banknote size={13} className="text-primary" />
                    Total setelah setoran ini
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(setorTarget.totalTerkumpul + (setorTarget.nominalPerBulan ?? 0))}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setSetorTarget(null)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={setorSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {setorSaving && (
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
        {cairkanTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCairkanTarget(null)}
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
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-gradient-green-from to-gradient-green-to text-white">
                    <PartyPopper size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Cairkan Simpanan</h2>
                    <p className="truncate text-xs text-text-secondary">{cairkanTarget.nama}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCairkanTarget(null)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-4 rounded-2xl bg-success/5 p-4 text-center">
                <p className="text-xs text-text-secondary">Total yang akan dicairkan</p>
                <p className="mt-1 text-2xl font-bold text-success">
                  {formatCurrency(cairkanTarget.totalTerkumpul)}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">
                  Dari {cairkanTarget.jumlahSetoran} kali setoran
                </p>
              </div>

              {cairkanTarget.progress < 100 && (
                <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-[11px] text-warning">
                  <AlertCircle size={13} className="shrink-0" />
                  Baru {cairkanTarget.jumlahSetoran} dari {cairkanTarget.target} bulan — tetap
                  bisa dicairkan lebih awal bila diperlukan.
                </p>
              )}

              <p className="mb-5 text-[11px] text-text-muted">
                Setelah dicairkan, catatan ini tersimpan sebagai riwayat dan siklus setoran baru
                otomatis dimulai dari 0.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCairkanTarget(null)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                >
                  Batal
                </button>
                <motion.button
                  type="button"
                  disabled={cairkanSaving}
                  onClick={submitCairkan}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-success/90 disabled:opacity-60"
                >
                  {cairkanSaving && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  Ya, Cairkan
                </motion.button>
              </div>
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <History size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Riwayat Setoran</h2>
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
                <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Coins size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {formatCurrency(historyTarget.totalTerkumpul)}
                    </p>
                    <p className="truncate text-[10px] text-text-muted">Siklus Berjalan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-success/10 p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                    <PartyPopper size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-text-primary">
                      {historyTarget.jumlahSetoran}/{historyTarget.target}
                    </p>
                    <p className="truncate text-[10px] text-text-muted">Progress Bulan</p>
                  </div>
                </div>
              </div>

              {historyTarget.lastPencairan && (
                <div className="relative mb-5 rounded-xl bg-background-hover px-3.5 py-3 text-xs">
                  <p className="flex items-center gap-1.5 font-semibold text-text-primary">
                    <History size={12} className="text-text-muted" />
                    Pencairan terakhir
                  </p>
                  <p className="mt-1 text-text-secondary">
                    {formatCurrency(historyTarget.lastPencairan.jumlah)} pada{" "}
                    {formatDateID(historyTarget.lastPencairan.tanggal)}
                  </p>
                </div>
              )}

              {historyLoading ? (
                <div className="relative flex flex-col items-center gap-2 py-10 text-text-secondary">
                  <Loader2 size={22} className="animate-spin text-primary" />
                  Memuat riwayat...
                </div>
              ) : historyList.length === 0 ? (
                <div className="relative flex flex-col items-center gap-2 py-10 text-center text-text-secondary">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background-hover">
                    <Gift size={20} className="text-text-muted" />
                  </span>
                  <p className="text-sm font-semibold">Belum ada setoran di siklus ini</p>
                </div>
              ) : (
                <div className="relative flex flex-col gap-2 border-l-2 border-dashed border-border pl-4">
                  {historyList.map((h, i) => (
                    <div key={h.id} className="relative">
                      <span
                        className={`absolute top-4 -left-[22.5px] h-3 w-3 rounded-full ring-4 ring-background-card ${
                          i === 0 ? "bg-primary" : "bg-border"
                        }`}
                      />
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-background-hover px-3.5 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Banknote size={14} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary">
                              {formatCurrency(h.nominal)}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-secondary">
                              <Wallet size={10} />
                              Periode {formatMonthYearID(new Date(`${h.periode}-01`))}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                              <Clock size={10} />
                              {formatDateID(h.tanggalSetor)} &middot; oleh {h.processedBy}
                            </p>
                          </div>
                        </div>
                        {i === 0 && (
                          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
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
