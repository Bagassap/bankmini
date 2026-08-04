"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Calendar,
  CheckCircle2,
  ClipboardList,
  History,
  PieChart,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCog,
} from "lucide-react";
import Layout from "@/components/Layout";
import { AnimatedCurrency } from "@/components/dashboard/AnimatedCurrency";
import { AtmCard } from "@/components/profil/AtmCard";
import { KuitansiModal } from "@/components/transaksi/KuitansiModal";
import { useLiveClock } from "@/hooks/useLiveClock";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import {
  formatCurrency,
  formatDate,
  formatFullDateID,
  formatTimeShort,
  getWibHour,
} from "@/lib/format";
import { jenisLabel } from "@/lib/transaksiMeta";
import { useAuthStore } from "@/store/authStore";
import type { Nasabah, Transaksi } from "@/lib/types";

export default function PortalDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<Nasabah | null>(null);
  const [mutasi, setMutasi] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [kuitansiTrx, setKuitansiTrx] = useState<Transaksi | null>(null);
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
      notify.error(getErrorMessage(error, "Gagal memuat data akun"));
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
    const totalSetor = setorList.reduce((sum, t) => sum + Number(t.jumlah), 0);
    const totalTarik = tarikList.reduce((sum, t) => sum + Number(t.jumlah), 0);
    const totalVolume = totalSetor + totalTarik;
    return {
      totalSetor,
      totalTarik,
      totalTransaksi: mutasi.length,
      setorShare: totalVolume > 0 ? Math.round((totalSetor / totalVolume) * 100) : 0,
      rataRata: mutasi.length > 0 ? totalVolume / mutasi.length : 0,
    };
  }, [mutasi]);

  const recent = mutasi.slice(0, 5);

  const fullDate = now ? formatFullDateID(now) : "—";
  const greeting = (() => {
    const hour = now ? getWibHour(now) : 12;
    if (hour < 10) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
  })();
  const initials = (user?.nama ?? "?").slice(0, 2).toUpperCase();
  const lastUpdatedLabel = lastUpdated ? formatTimeShort(lastUpdated) : "—";

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
          <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-dark p-6 text-white shadow-soft sm:p-7 lg:col-span-2"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[18px_18px]"
              />
              <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-6">
                <div className="lg:flex-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                    <ShieldCheck size={12} />
                    {jenisLabel[profile.jenisNasabah]} &middot; {profile.noRekening}
                  </span>
                  <p className="mt-2.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
                    Saldo Saat Ini
                  </p>
                  <AnimatedCurrency
                    value={Number(profile.saldo)}
                    className="mt-1 block text-3xl font-bold sm:text-4xl"
                  />
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/70">
                    <CheckCircle2 size={13} />
                    Saldo aktif &middot; Diperbarui {formatDate(profile.updatedAt)}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-3">
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

                <div className="border-t border-white/15 pt-4 lg:w-56 lg:shrink-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-white/70 uppercase">
                    <PieChart size={12} />
                    Arus Kas
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-2xl bg-white/10 p-2.5">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                        <ArrowDownToLine size={11} />
                        Setoran
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold">
                        {formatCurrency(stats.totalSetor)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-2.5">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold text-white/70 uppercase">
                        <ArrowUpFromLine size={11} />
                        Penarikan
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold">
                        {formatCurrency(stats.totalTarik)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${stats.setorShare}%` }}
                    />
                    <div
                      className="h-full bg-white/35"
                      style={{ width: `${100 - stats.setorShare}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-white/60">
                    <span>Setor {stats.setorShare}%</span>
                    <span>Tarik {100 - stats.setorShare}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-1 lg:self-start"
            >
              <AtmCard nasabah={profile} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative overflow-hidden rounded-3xl bg-background-card shadow-soft"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
            />
            <div className="pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex items-center justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
                >
                  <ClipboardList size={18} />
                </motion.span>
                <div>
                  <p className="text-sm font-bold text-text-primary">Transaksi Terakhir</p>
                  <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                    </span>
                    {recent.length} transaksi terkini
                  </p>
                </div>
              </div>
              {recent.length > 0 && (
                <span className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary sm:flex">
                  <History size={12} />
                  Real-time
                </span>
              )}
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
              className="relative divide-y divide-border"
            >
              {recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-5 py-12 text-center text-text-secondary">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background-hover">
                    <ClipboardList size={22} className="text-text-muted" />
                  </span>
                  <p className="text-sm font-semibold">Belum ada transaksi</p>
                  <p className="text-xs text-text-muted">
                    Riwayat setor &amp; tarik Anda akan muncul di sini
                  </p>
                </div>
              ) : (
                recent.map((trx, i) => {
                  const isSetor = trx.jenisTransaksi === "setor";
                  return (
                    <motion.div
                      key={trx.id}
                      variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0, transition: { duration: 0.25 } } }}
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-3 p-4 transition-colors hover:bg-background-hover"
                    >
                      <span
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                          isSetor
                            ? "bg-linear-to-br from-gradient-green-from to-gradient-green-to"
                            : "bg-linear-to-br from-gradient-orange-from to-gradient-orange-to"
                        }`}
                      >
                        {isSetor ? <ArrowDownToLine size={17} /> : <ArrowUpFromLine size={17} />}
                        {i === 0 && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background-card">
                            <span className="h-2 w-2 rounded-full bg-success ring-2 ring-background-card" />
                          </span>
                        )}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex shrink-0 items-center gap-1.5">
                          <p className="text-sm font-semibold text-text-primary">
                            {isSetor ? "Setor Tunai" : "Tarik Tunai"}
                          </p>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                              isSetor ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                            }`}
                          >
                            {isSetor ? "MASUK" : "KELUAR"}
                          </span>
                        </div>

                        <span className="h-4 w-px shrink-0 bg-border" />

                        <p className="min-w-0 flex-1 truncate text-sm text-text-secondary">
                          <span className="font-mono">{trx.noTransaksi}</span>{" "}
                          &middot; {formatDate(trx.createdAt)}
                        </p>

                        <span className="h-4 w-px shrink-0 bg-border" />

                        <p className={`shrink-0 text-sm font-bold ${isSetor ? "text-success" : "text-danger"}`}>
                          {isSetor ? "+ " : "- "}
                          {formatCurrency(trx.jumlah)}
                        </p>

                        <span className="h-4 w-px shrink-0 bg-border" />

                        <button
                          type="button"
                          onClick={() => setKuitansiTrx(trx)}
                          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-dark hover:underline"
                        >
                          <Receipt size={13} />
                          Kwitansi
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>

            <div className="relative p-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/portal/riwayat")}
                className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                Lihat Semua Riwayat
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <KuitansiModal
        transaksi={kuitansiTrx}
        nasabah={profile}
        tellerNama={kuitansiTrx?.processedBy?.nama ?? "-"}
        onClose={() => setKuitansiTrx(null)}
      />
    </Layout>
  );
}
