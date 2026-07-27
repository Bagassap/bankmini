"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  BookUser,
  GraduationCap,
  History,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AnimatedCurrency } from "./AnimatedCurrency";
import { formatCurrency } from "@/lib/format";
import type { JenisNasabah, Transaksi } from "@/lib/types";

const JENIS_COLOR: Record<JenisNasabah, string> = {
  siswa: "#1120f0",
  guru: "#f59e0b",
  umum: "#10b981",
};

const JENIS_LABEL: Record<JenisNasabah, string> = {
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
};

const JENIS_ICON: Record<JenisNasabah, typeof GraduationCap> = {
  siswa: GraduationCap,
  guru: BookUser,
  umum: Users,
};

const statRowVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const statItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
};

export function BalanceCard({
  kasSaatIni,
  totalTransaksiHariIni,
  totalSetoranHariIni,
  totalPenarikanHariIni,
  setorPercent,
  setorCount = 0,
  tarikCount = 0,
  perJenis,
  totalNasabah,
  recent = [],
  onTransaksiBaru,
  onLihatMutasi,
  onRefresh,
  refreshing,
  primaryActionLabel = "Transaksi Baru",
  nasabahHref = "/nasabah",
}: {
  kasSaatIni: number;
  totalTransaksiHariIni: number;
  totalSetoranHariIni: number;
  totalPenarikanHariIni: number;
  setorPercent: number;
  setorCount?: number;
  tarikCount?: number;
  perJenis: { jenisNasabah: JenisNasabah; jumlah: number }[];
  totalNasabah: number;
  recent?: Transaksi[];
  onTransaksiBaru: () => void;
  onLihatMutasi: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  primaryActionLabel?: string;
  nasabahHref?: string;
}) {
  const isSurplus = kasSaatIni >= 0;
  const tarikPercent = 100 - setorPercent;
  const updatedAt = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const insightText =
    totalTransaksiHariIni === 0
      ? "Belum ada transaksi tercatat hari ini"
      : setorPercent >= tarikPercent
        ? `Setoran mendominasi ${setorPercent}% transaksi hari ini`
        : `Penarikan lebih banyak (${tarikPercent}%) hari ini`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden grid grid-cols-1 gap-6 rounded-3xl bg-background-card p-6 shadow-soft lg:grid-cols-[1.3fr_0.85fr_0.9fr] lg:items-center lg:gap-8 lg:p-8"
    >
      {/* decorative texture + glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[18px_18px]"
      />
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      {/* Left: balance + mini stats + actions */}
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet size={14} />
            </span>
            <p className="text-xs font-bold tracking-widest text-text-muted uppercase">
              Saldo Kas Saat Ini
            </p>
          </div>
          {onRefresh && (
            <motion.button
              type="button"
              onClick={onRefresh}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              title="Segarkan data"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background-hover hover:text-primary"
            >
              <motion.span
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  refreshing
                    ? { duration: 0.8, repeat: Infinity, ease: "linear" }
                    : { duration: 0.2 }
                }
                className="flex"
              >
                <RefreshCw size={14} />
              </motion.span>
            </motion.button>
          )}
        </div>

        <AnimatedCurrency
          value={kasSaatIni}
          className="mt-2 block text-3xl font-bold text-text-primary sm:text-4xl"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {totalTransaksiHariIni} transaksi tercatat hari ini
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              isSurplus ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {isSurplus ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isSurplus ? "Surplus" : "Defisit"} hari ini
          </span>
        </div>

        <p className="mt-1 text-[11px] text-text-muted">
          Diperbarui pukul {updatedAt} &middot; {insightText}
        </p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={statRowVariants}
          className="mt-6 flex flex-wrap gap-6"
        >
          <motion.div
            variants={statItemVariants}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
              <ArrowDownToLine size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">
                {formatCurrency(totalSetoranHariIni)}
              </p>
              <p className="text-xs text-text-muted">Setoran</p>
            </div>
          </motion.div>
          <motion.div
            variants={statItemVariants}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
              <ArrowUpFromLine size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-text-primary">
                {formatCurrency(totalPenarikanHariIni)}
              </p>
              <p className="text-xs text-text-muted">Penarikan</p>
            </div>
          </motion.div>
        </motion.div>

        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {recent.slice(0, 4).map((trx, i) => {
                const initials = (trx.nasabah?.nama ?? "?")
                  .slice(0, 2)
                  .toUpperCase();
                const color = trx.nasabah?.jenisNasabah
                  ? JENIS_COLOR[trx.nasabah.jenisNasabah]
                  : "#94a3b8";
                return (
                  <motion.span
                    key={trx.id}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background-card text-[10px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                    title={trx.nasabah?.nama}
                  >
                    {initials}
                  </motion.span>
                );
              })}
            </div>
            <p className="text-xs text-text-secondary">
              Nasabah bertransaksi terbaru
            </p>
          </motion.div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onTransaksiBaru}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold tracking-wide text-white uppercase shadow-sm"
          >
            <Plus size={14} />
            {primaryActionLabel}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLihatMutasi}
            className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-xs font-bold tracking-wide text-text-secondary uppercase"
          >
            <History size={14} />
            Lihat Mutasi
          </motion.button>
        </div>
      </div>

      {/* Middle: Setor vs Tarik donut */}
      <div className="relative flex flex-col items-center justify-center gap-3 lg:border-x lg:border-border lg:px-4">
        <motion.div
          className="relative h-36 w-36"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: "Setor", value: setorPercent, count: setorCount },
                  { name: "Tarik", value: tarikPercent, count: tarikCount },
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius="72%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                cornerRadius={8}
                paddingAngle={3}
                stroke="none"
                isAnimationActive
                animationDuration={700}
              >
                <Cell fill="#1120f0" />
                <Cell fill="#e5e7eb" />
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0]?.payload as {
                    name: string;
                    value: number;
                    count: number;
                  };
                  return (
                    <div className="rounded-lg border border-border bg-background-card px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold text-text-primary">
                        {item.name} {item.value}%
                      </p>
                      <p className="text-text-muted">
                        {item.count} transaksi
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-text-primary">
              {setorPercent}%
            </p>
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Setor
            </p>
          </div>
        </motion.div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Setor {setorPercent}%
          </span>
          <span className="flex items-center gap-1.5 font-medium text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-border" />
            Tarik {tarikPercent}%
          </span>
        </div>
        <p className="text-[11px] text-text-muted">
          Berdasarkan {setorCount + tarikCount} transaksi hari ini
        </p>
      </div>

      {/* Right: nasabah category breakdown */}
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-text-muted uppercase">
            Kategori Nasabah
          </p>
          <span className="rounded-full bg-background-hover px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
            {totalNasabah} total
          </span>
        </div>

        {/* Bar proporsi gabungan seluruh kategori */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-background-hover">
          {perJenis.map((item, i) => {
            const percent =
              totalNasabah > 0 ? (item.jumlah / totalNasabah) * 100 : 0;
            return (
              <motion.div
                key={item.jenisNasabah}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ backgroundColor: JENIS_COLOR[item.jenisNasabah] }}
              />
            );
          })}
        </div>

        {perJenis.map((item, i) => {
          const percent =
            totalNasabah > 0
              ? Math.round((item.jumlah / totalNasabah) * 100)
              : 0;
          const Icon = JENIS_ICON[item.jenisNasabah];
          const color = JENIS_COLOR[item.jenisNasabah];
          return (
            <motion.div
              key={item.jenisNasabah}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.25 + i * 0.08 }}
            >
              <Link
                href={`${nasabahHref}?jenis=${item.jenisNasabah}`}
                className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-background-hover"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}1a`, color }}
                  >
                    <Icon size={13} />
                  </span>
                  <span className="text-sm font-medium text-text-secondary">
                    {JENIS_LABEL[item.jenisNasabah]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-primary">
                    {item.jumlah}
                  </p>
                  <p className="text-[11px] text-text-muted">{percent}%</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
        <Link
          href={nasabahHref}
          className="group mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
        >
          Lihat Semua Nasabah
          <ArrowRight
            size={12}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </motion.div>
  );
}
