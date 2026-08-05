"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import { DateRangePicker } from "@/components/DateRangePicker";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate, formatDigitsID } from "@/lib/format";
import {
  KATEGORI_PENGELUARAN_COLOR,
  KATEGORI_PENGELUARAN_ICON,
  KATEGORI_PENGELUARAN_OPTIONS,
  kategoriPengeluaranLabel,
} from "@/lib/pengeluaranMeta";
import { useAuthStore } from "@/store/authStore";
import type { KategoriPengeluaran, Pengeluaran } from "@/lib/types";

const PAGE_SIZE = 8;

const inputClass =
  "w-full rounded-xl border border-transparent bg-background-hover px-3 py-2.5 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20";

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export function PengeluaranPageContent() {
  const role = useAuthStore((state) => state.user?.role);
  const canInput = role === "teller" || role === "co_teller";
  const canEdit = role === "admin" || role === "superadmin";

  const [kategoriFilter, setKategoriFilter] = useState<KategoriPengeluaran | "">("");
  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [createKategori, setCreateKategori] = useState<KategoriPengeluaran>(
    KATEGORI_PENGELUARAN_OPTIONS[0],
  );
  const [createKeterangan, setCreateKeterangan] = useState("");
  const [createJumlah, setCreateJumlah] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  const [editTarget, setEditTarget] = useState<Pengeluaran | null>(null);
  const [editKategori, setEditKategori] = useState<KategoriPengeluaran>(
    KATEGORI_PENGELUARAN_OPTIONS[0],
  );
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editJumlah, setEditJumlah] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const loadPengeluaran = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get<Pengeluaran[]>("/pengeluaran", {
        params: {
          kategori: kategoriFilter || undefined,
          from: from || undefined,
          to: to ? `${to}T23:59:59.999` : undefined,
          limit: 500,
        },
      });
      setData(res);
      setPage(1);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memuat data pengeluaran"));
    } finally {
      setLoading(false);
    }
  }, [kategoriFilter, from, to]);

  useEffect(() => {
    loadPengeluaran();
  }, [loadPengeluaran]);

  const stats = useMemo(() => {
    const total = data.reduce((sum, p) => sum + Number(p.jumlah), 0);
    const perKategoriMap = new Map<KategoriPengeluaran, { count: number; total: number }>();
    for (const p of data) {
      const entry = perKategoriMap.get(p.kategori) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(p.jumlah);
      perKategoriMap.set(p.kategori, entry);
    }
    const perKategori = Array.from(perKategoriMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([kategori, entry]) => ({
        kategori,
        count: entry.count,
        total: entry.total,
        share: total > 0 ? Math.round((entry.total / total) * 100) : 0,
      }));
    return { total, count: data.length, perKategori };
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openEdit(item: Pengeluaran) {
    setEditTarget(item);
    setEditKategori(item.kategori);
    setEditKeterangan(item.keterangan);
    setEditJumlah(String(Math.round(Number(item.jumlah))));
  }

  function closeEdit() {
    setEditTarget(null);
    setEditKeterangan("");
    setEditJumlah("");
  }

  function closeCreate() {
    setShowCreate(false);
    setCreateKategori(KATEGORI_PENGELUARAN_OPTIONS[0]);
    setCreateKeterangan("");
    setCreateJumlah("");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const jumlahNumber = Number(createJumlah) || 0;
    if (jumlahNumber <= 0) {
      notify.error("Jumlah harus lebih dari 0");
      return;
    }
    if (!createKeterangan.trim()) {
      notify.error("Keterangan wajib diisi");
      return;
    }
    setCreateSaving(true);
    try {
      await api.post("/pengeluaran", {
        kategori: createKategori,
        keterangan: createKeterangan.trim(),
        jumlah: jumlahNumber,
      });
      notify.success("Pengeluaran berhasil dicatat");
      closeCreate();
      loadPengeluaran();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal mencatat pengeluaran"));
    } finally {
      setCreateSaving(false);
    }
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
      await api.patch(`/pengeluaran/${editTarget.id}`, {
        kategori: editKategori,
        jumlah: jumlahNumber,
        keterangan: editKeterangan.trim() || undefined,
      });
      notify.success("Pengeluaran berhasil diperbarui");
      closeEdit();
      loadPengeluaran();
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal memperbarui pengeluaran"));
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-5 flex flex-col justify-between gap-4 md:mb-7 md:flex-row md:items-end 2xl:mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pengeluaran Operasional</h1>
          <p className="text-sm text-text-secondary">
            {canInput
              ? "Catat pengeluaran kas Bank Mini untuk kebutuhan operasional (bukan uang nasabah)."
              : "Pantau seluruh pengeluaran operasional yang dicatat teller."}
          </p>
        </div>

        {canInput && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            <Plus size={16} />
            Catat Pengeluaran
          </motion.button>
        )}
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
              <p className="text-sm font-bold">Filter Pengeluaran</p>
              <p className="text-xs text-white/70">Kategori &amp; rentang tanggal</p>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKategoriFilter("")}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                kategoriFilter === ""
                  ? "bg-white text-primary shadow-sm"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              Semua
            </button>
            {KATEGORI_PENGELUARAN_OPTIONS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKategoriFilter(k)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  kategoriFilter === k
                    ? "bg-white text-primary shadow-sm"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {kategoriPengeluaranLabel[k]}
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

          <div className="relative mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
                <TrendingDown size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-text-primary">Ringkasan Pengeluaran</p>
                <p className="text-xs text-text-secondary">Sesuai filter yang dipilih</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-danger">{formatCurrency(stats.total)}</p>
              <p className="text-[11px] text-text-secondary">{stats.count} pencatatan</p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
            {stats.perKategori.length === 0 ? (
              <p className="col-span-2 text-center text-xs text-text-muted sm:col-span-3">
                Belum ada pengeluaran pada periode ini
              </p>
            ) : (
              stats.perKategori.map((cat) => {
                const Icon = KATEGORI_PENGELUARAN_ICON[cat.kategori];
                const color = KATEGORI_PENGELUARAN_COLOR[cat.kategori];
                return (
                  <div
                    key={cat.kategori}
                    className="flex items-center gap-2.5 rounded-xl p-2.5"
                    style={{ backgroundColor: `${color}0d` }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}1a`, color }}
                    >
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-text-secondary">
                        {kategoriPengeluaranLabel[cat.kategori]}
                      </p>
                      <p className="flex items-baseline gap-1 whitespace-nowrap">
                        <span className="text-xs font-bold text-text-primary">
                          {formatCurrency(cat.total)}
                        </span>
                        <span className="text-[10px] font-medium text-text-muted">
                          ({cat.share}%)
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
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
              <Receipt size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">Daftar Pengeluaran</p>
              <p className="text-xs text-text-secondary">Diurutkan dari yang terbaru</p>
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
                  Kategori
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Keterangan
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Dicatat Oleh
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                  Jumlah
                </th>
                {canEdit && (
                  <th className="px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
            >
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Loader2 size={22} className="animate-spin text-primary" />
                      Memuat data pengeluaran...
                    </div>
                  </td>
                </tr>
              ) : pagedData.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-text-secondary">
                      <Receipt size={26} className="text-text-muted" />
                      Tidak ada pengeluaran pada periode ini
                    </div>
                  </td>
                </tr>
              ) : (
                pagedData.map((item) => {
                  const Icon = KATEGORI_PENGELUARAN_ICON[item.kategori];
                  const color = KATEGORI_PENGELUARAN_COLOR[item.kategori];
                  return (
                    <motion.tr
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, y: 6 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                      }}
                      className="border-b border-border transition-colors last:border-0 hover:bg-background-hover"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ backgroundColor: `${color}1a`, color }}
                        >
                          <Icon size={12} />
                          {kategoriPengeluaranLabel[item.kategori]}
                        </span>
                      </td>
                      <td
                        className="max-w-52 truncate px-4 py-3 text-xs text-text-secondary"
                        title={item.keterangan}
                      >
                        <div className="flex items-center gap-1.5">
                          {item.keterangan}
                          {item.editedBy && (
                            <span
                              title={`Diedit oleh ${item.editedBy.nama}`}
                              className="flex shrink-0 items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold text-warning"
                            >
                              <Pencil size={8} />
                              Diedit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {item.processedBy?.nama ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-danger">
                          -{formatCurrency(item.jumlah)}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openEdit(item)}
                            className="flex items-center gap-1 rounded-lg bg-warning/10 px-2.5 py-1.5 text-xs font-bold text-warning transition-colors hover:bg-warning/20"
                          >
                            <Pencil size={12} />
                            Edit
                          </motion.button>
                        </td>
                      )}
                    </motion.tr>
                  );
                })
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreate}
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                    <Wallet size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Catat Pengeluaran</h2>
                    <p className="text-xs text-text-secondary">Kas operasional Bank Mini</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeCreate}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={submitCreate} className="relative flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Kategori
                  </label>
                  <select
                    value={createKategori}
                    onChange={(e) => setCreateKategori(e.target.value as KategoriPengeluaran)}
                    className={inputClass}
                  >
                    {KATEGORI_PENGELUARAN_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {kategoriPengeluaranLabel[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Jumlah
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background-hover px-3 py-2.5 transition-colors focus-within:border-primary">
                    <span className="text-sm font-bold text-text-muted">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formatDigitsID(createJumlah)}
                      onChange={(e) => setCreateJumlah(e.target.value.replace(/\D/g, ""))}
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
                    required
                    value={createKeterangan}
                    onChange={(e) => setCreateKeterangan(e.target.value)}
                    placeholder="Misal: Cetak 50 buku tabungan baru"
                    className={inputClass}
                  />
                </div>

                <div className="mt-1 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-background-hover"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={createSaving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {createSaving && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    Simpan
                  </motion.button>
                </div>
              </form>
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
                    <h2 className="text-lg font-bold text-text-primary">Edit Pengeluaran</h2>
                    <p className="text-xs text-text-secondary">
                      Dicatat oleh {editTarget.processedBy?.nama ?? "-"}
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

              <form onSubmit={submitEdit} className="relative flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                    Kategori
                  </label>
                  <select
                    value={editKategori}
                    onChange={(e) => setEditKategori(e.target.value as KategoriPengeluaran)}
                    className={inputClass}
                  >
                    {KATEGORI_PENGELUARAN_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {kategoriPengeluaranLabel[k]}
                      </option>
                    ))}
                  </select>
                </div>

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
                    placeholder="Misal: Cetak 50 buku tabungan baru"
                    className={inputClass}
                  />
                </div>

                <p className="flex items-start gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-[11px] text-warning">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Perubahan ini tercatat sebagai koreksi oleh admin/superadmin.
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
    </Layout>
  );
}
