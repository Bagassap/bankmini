"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Calendar,
  ClipboardList,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCog,
  Wallet,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AnimatedCurrency } from "@/components/dashboard/AnimatedCurrency";
import { GradientStatCard } from "@/components/dashboard/GradientStatCard";
import { useLiveClock } from "@/hooks/useLiveClock";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { JenisNasabah, Nasabah, Transaksi } from "@/lib/types";

const JENIS_LABEL: Record<JenisNasabah, string> = {
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
};

export default function BerandaPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<Nasabah | null>(null);
  const [mutasi, setMutasi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const now = useLiveClock();

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [profileRes, mutasiRes] = await Promise.all([
        api.get<Nasabah>("/nasabah/me"),
        api.get<Transaksi[]>(`/transaksi/mutasi/${user!.id}`),
      ]);
      setProfile(profileRes.data);
      setMutasi(mutasiRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memuat data akun"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  const stats = useMemo(() => {
    const setorList = mutasi.filter((t) => t.jenisTransaksi === "setor");
    const tarikList = mutasi.filter((t) => t.jenisTransaksi === "tarik");
    return {
      totalSetor: setorList.reduce((sum, t) => sum + Number(t.jumlah), 0),
      totalTarik: tarikList.reduce((sum, t) => sum + Number(t.jumlah), 0),
      totalTransaksi: mutasi.length,
    };
  }, [mutasi]);

  const recent = mutasi.slice(0, 5);

  const fullDate = now
    ? now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
  const greeting = (() => {
    const hour = now?.getHours() ?? 12;
    if (hour < 10) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  })();
  const initials = (user?.nama ?? "?").slice(0, 2).toUpperCase();
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "—";

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
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-base font-bold text-white shadow-sm"
            >
              {initials}
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-background-card"
              />
            </motion.span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles size={12} />
                {greeting}
              </p>
              <h1 className="text-2xl font-bold text-text-primary">
                Halo, {user?.nama ?? "Nasabah"}!
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <Calendar size={13} className="text-text-muted" />
                {fullDate}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2.5 rounded-full bg-primary/10 py-1.5 pr-3.5 pl-1.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ClipboardList size={16} />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-primary">
                  {stats.totalTransaksi} Transaksi
                </span>
                <span className="block text-[10px] text-primary/70">Sepanjang Waktu</span>
              </span>
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadData(true)}
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
                <span className="block text-xs font-bold text-text-primary">
                  {lastUpdatedLabel}
                </span>
                <span className="block text-[10px] text-text-muted">Diperbarui</span>
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {loading || !profile ? (
        <p className="text-sm text-text-secondary">Memuat data...</p>
      ) : (
        <div className="space-y-4 md:space-y-6 2xl:space-y-7.5">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[18px_18px]"
            />
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  <ShieldCheck size={12} />
                  {JENIS_LABEL[profile.jenisNasabah]} &middot; {profile.noRekening}
                </span>
                <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
                  <Wallet size={13} />
                  Saldo Saat Ini
                </p>
                <AnimatedCurrency
                  value={Number(profile.saldo)}
                  className="mt-1 block text-4xl font-bold sm:text-5xl"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/portal/riwayat")}
                  className="flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-xs font-bold tracking-wide text-primary uppercase shadow-sm"
                >
                  <History size={14} />
                  Lihat Riwayat
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/portal/profil")}
                  className="flex items-center gap-1.5 rounded-xl border border-white/30 px-5 py-2.5 text-xs font-bold tracking-wide text-white uppercase"
                >
                  <UserCog size={14} />
                  Profil Saya
                </motion.button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6 2xl:gap-7.5">
            <GradientStatCard
              tone="green"
              label="Total Setoran"
              value={stats.totalSetor}
              caption="Sepanjang waktu"
              icon={ArrowDownToLine}
            />
            <GradientStatCard
              tone="orange"
              label="Total Penarikan"
              value={stats.totalTarik}
              caption="Sepanjang waktu"
              icon={ArrowUpFromLine}
            />
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}
              whileHover={{ y: -4 }}
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft transition-shadow hover:shadow-lg"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
              />
              <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <ClipboardList size={18} />
              </span>
              <p className="relative mt-5 text-sm font-medium text-white/85">Jumlah Transaksi</p>
              <p className="relative mt-1 text-2xl font-bold">{stats.totalTransaksi}</p>
              <p className="relative mt-1 text-xs text-white/70">Tercatat di rekening Anda</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="overflow-hidden rounded-3xl bg-background-card shadow-soft"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardList size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Transaksi Terakhir</p>
                  <p className="text-xs text-text-secondary">5 transaksi paling baru</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-text-secondary">
                  <ClipboardList size={26} className="text-text-muted" />
                  Belum ada transaksi
                </div>
              ) : (
                recent.map((trx) => {
                  const isSetor = trx.jenisTransaksi === "setor";
                  return (
                    <div
                      key={trx.id}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-background-hover"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          isSetor ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}
                      >
                        {isSetor ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text-primary capitalize">
                          {isSetor ? "Setor Tunai" : "Tarik Tunai"}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                          {formatDate(trx.createdAt)}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold ${isSetor ? "text-success" : "text-danger"}`}>
                        {isSetor ? "+ " : "- "}
                        {formatCurrency(trx.jumlah)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4">
              <button
                type="button"
                onClick={() => router.push("/portal/riwayat")}
                className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
              >
                Lihat Semua Riwayat
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
