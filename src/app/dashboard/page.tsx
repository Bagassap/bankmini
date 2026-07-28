"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  Landmark,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Layout from "@/components/Layout";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { GradientStatCard } from "@/components/dashboard/GradientStatCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { CashFlowCard } from "@/components/dashboard/CashFlowCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { useLiveClock } from "@/hooks/useLiveClock";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { formatCurrency } from "@/lib/format";
import { useAuthStore } from "@/store/authStore";
import type { NasabahStats, Transaksi, TransaksiStats } from "@/lib/types";

const KAS_UTAMA_DUMMY = 250_000_000;

const statsContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [nasabahStats, setNasabahStats] = useState<NasabahStats | null>(null);
  const [transaksiStats, setTransaksiStats] = useState<TransaksiStats | null>(
    null,
  );
  const [recent, setRecent] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const now = useLiveClock();

  const loadStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [nasabahRes, transaksiRes, recentRes] = await Promise.all([
        api.get<NasabahStats>("/nasabah/stats"),
        api.get<TransaksiStats>("/transaksi/stats"),
        api.get<Transaksi[]>("/transaksi", { params: { limit: 5 } }),
      ]);
      setNasabahStats(nasabahRes.data);
      setTransaksiStats(transaksiRes.data);
      setRecent(recentRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memuat statistik dashboard"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

  const totalSetoranHariIni = Number(transaksiStats?.setor.totalNominal ?? 0);
  const totalPenarikanHariIni = Number(transaksiStats?.tarik.totalNominal ?? 0);
  const kasSaatIni = totalSetoranHariIni - totalPenarikanHariIni;
  const totalTransaksiHariIni = transaksiStats?.totalTransaksi ?? 0;
  const setorCount = transaksiStats?.setor.jumlahTransaksi ?? 0;
  const tarikCount = transaksiStats?.tarik.jumlahTransaksi ?? 0;
  const setorPercent =
    setorCount + tarikCount > 0
      ? Math.round((setorCount / (setorCount + tarikCount)) * 100)
      : 0;
  const tarikCountPercent =
    setorCount + tarikCount > 0
      ? Math.round((tarikCount / (setorCount + tarikCount)) * 100)
      : 0;
  const totalSaldoNasabahAktif = Number(nasabahStats?.totalSaldo ?? 0);
  const totalNasabahAktif = nasabahStats?.totalNasabah ?? 0;
  const rataSaldoPerNasabah =
    totalNasabahAktif > 0 ? totalSaldoNasabahAktif / totalNasabahAktif : 0;

  const totalArusKas = totalSetoranHariIni + totalPenarikanHariIni;
  const setorProporsiNominal =
    totalArusKas > 0 ? Math.round((totalSetoranHariIni / totalArusKas) * 100) : 0;
  const tarikProporsiNominal =
    totalArusKas > 0 ? Math.round((totalPenarikanHariIni / totalArusKas) * 100) : 0;

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
                Selamat datang, {user?.nama ?? "Teller"}!
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
                <Landmark size={16} />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-primary">
                  {totalTransaksiHariIni} Transaksi
                </span>
                <span className="block text-[10px] text-primary/70">Hari Ini</span>
              </span>
            </span>
            <span className="flex items-center gap-2.5 rounded-full bg-background-hover py-1.5 pr-3.5 pl-1.5">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <RefreshCw size={16} />
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background-card"
                />
              </span>
              <span className="text-left leading-tight">
                <span className="block text-xs font-bold text-text-primary">
                  {lastUpdatedLabel}
                </span>
                <span className="block text-[10px] text-text-muted">Diperbarui</span>
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <p className="text-sm text-text-secondary">Memuat data...</p>
      ) : (
        <div className="space-y-4 md:space-y-6 2xl:space-y-7.5">
          <BalanceCard
            kasSaatIni={kasSaatIni}
            totalTransaksiHariIni={totalTransaksiHariIni}
            totalSetoranHariIni={totalSetoranHariIni}
            totalPenarikanHariIni={totalPenarikanHariIni}
            setorPercent={setorPercent}
            setorCount={setorCount}
            tarikCount={tarikCount}
            perJenis={nasabahStats?.perJenis ?? []}
            totalNasabah={totalNasabahAktif}
            recent={recent}
            onTransaksiBaru={() => router.push("/transaksi/setor")}
            onLihatMutasi={() => router.push("/mutasi")}
            onRefresh={() => loadStats(true)}
            refreshing={refreshing}
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={statsContainerVariants}
            className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 2xl:gap-7.5"
          >
            <GradientStatCard
              tone="orange"
              label="Kas Utama"
              value={KAS_UTAMA_DUMMY}
              caption="Saldo ledger kas fisik (sementara)"
              icon={Wallet}
              secondaryLabel="Menunggu integrasi API kas"
              secondaryIcon={AlertCircle}
            />
            <GradientStatCard
              tone="blue"
              label="Setoran Hari Ini"
              value={totalSetoranHariIni}
              caption={`${setorCount} transaksi setor`}
              icon={ArrowDownToLine}
              secondaryLabel={`${setorPercent}% dari transaksi hari ini`}
              secondaryIcon={TrendingUp}
            />
            <GradientStatCard
              tone="cyan"
              label="Penarikan Hari Ini"
              value={totalPenarikanHariIni}
              caption={`${tarikCount} transaksi tarik`}
              icon={ArrowUpFromLine}
              secondaryLabel={`${tarikCountPercent}% dari transaksi hari ini`}
              secondaryIcon={TrendingDown}
            />
            <GradientStatCard
              tone="green"
              label="Saldo Nasabah Aktif"
              value={totalSaldoNasabahAktif}
              caption={`${totalNasabahAktif} nasabah terdaftar`}
              icon={Wallet}
              secondaryLabel={`Rata-rata ${formatCurrency(rataSaldoPerNasabah)}/nasabah`}
              secondaryIcon={Users}
            />
          </motion.div>

          <div className="grid grid-cols-1 gap-4 md:gap-6 2xl:gap-7.5 lg:grid-cols-3">
            <TransactionList data={recent} className="lg:col-span-2" />

            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <CashFlowCard
                  label="Pemasukan Hari Ini"
                  value={totalSetoranHariIni}
                  count={setorCount}
                  proportion={setorProporsiNominal}
                  icon={ArrowDownToLine}
                  tone="success"
                />
                <CashFlowCard
                  label="Pengeluaran Hari Ini"
                  value={totalPenarikanHariIni}
                  count={tarikCount}
                  proportion={tarikProporsiNominal}
                  icon={ArrowUpFromLine}
                  tone="danger"
                />
              </div>
              <QuickActionsCard />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
