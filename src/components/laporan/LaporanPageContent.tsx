"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  BookUser,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Landmark,
  Loader2,
  PieChart as PieChartIcon,
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import Layout from "@/components/Layout";
import { downloadExcel } from "@/lib/exportExcel";
import { formatCurrency } from "@/lib/format";

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  caption: string;
  gradient: string;
}

const stats: Stat[] = [
  {
    label: "Total Transaksi",
    value: "1.284",
    change: "+8,2%",
    trend: "up",
    icon: Landmark,
    caption: "Transaksi bulan ini",
    gradient: "from-primary to-primary-dark",
  },
  {
    label: "Total Setoran",
    value: formatCurrency(184_500_000),
    change: "+12,4%",
    trend: "up",
    icon: ArrowDownToLine,
    caption: "Setoran tunai masuk",
    gradient: "from-gradient-green-from to-gradient-green-to",
  },
  {
    label: "Total Penarikan",
    value: formatCurrency(96_200_000),
    change: "-3,1%",
    trend: "down",
    icon: ArrowUpFromLine,
    caption: "Penarikan tunai keluar",
    gradient: "from-gradient-orange-from to-gradient-orange-to",
  },
  {
    label: "Nasabah Aktif",
    value: "342",
    change: "+5,6%",
    trend: "up",
    icon: Users,
    caption: "Nasabah berstatus aktif",
    gradient: "from-gradient-blue-from to-gradient-blue-to",
  },
];

const barData6: { month: string; setor: number; tarik: number }[] = [
  { month: "Feb", setor: 24, tarik: 14 },
  { month: "Mar", setor: 30, tarik: 18 },
  { month: "Apr", setor: 22, tarik: 12 },
  { month: "Mei", setor: 34, tarik: 20 },
  { month: "Jun", setor: 28, tarik: 16 },
  { month: "Jul", setor: 38, tarik: 22 },
];

const barData12 = [
  { month: "Ags", setor: 20, tarik: 10 },
  { month: "Sep", setor: 18, tarik: 9 },
  { month: "Okt", setor: 26, tarik: 15 },
  { month: "Nov", setor: 21, tarik: 11 },
  { month: "Des", setor: 32, tarik: 19 },
  { month: "Jan", setor: 19, tarik: 13 },
  ...barData6,
];

const dailyData: { label: string; setor: number; tarik: number }[] = [
  { label: "Senin", setor: 5.2, tarik: 2.8 },
  { label: "Selasa", setor: 6.8, tarik: 3.1 },
  { label: "Rabu", setor: 4.5, tarik: 4.6 },
  { label: "Kamis", setor: 7.9, tarik: 3.4 },
  { label: "Jumat", setor: 6.1, tarik: 3.9 },
  { label: "Sabtu", setor: 3.4, tarik: 1.5 },
  { label: "Minggu", setor: 2.1, tarik: 1.1 },
];

const weeklyData: { label: string; setor: number; tarik: number }[] = [
  { label: "Minggu 1", setor: 24, tarik: 14 },
  { label: "Minggu 2", setor: 30, tarik: 18 },
  { label: "Minggu 3", setor: 22, tarik: 12 },
  { label: "Minggu 4", setor: 38, tarik: 22 },
];

const perbandinganPeriode = {
  setoran: { sekarang: 184_500_000, sebelumnya: 164_200_000 },
  penarikan: { sekarang: 96_200_000, sebelumnya: 99_300_000 },
};

const komposisi = [
  { name: "Setor", value: 65, color: "#22c55e" },
  { name: "Tarik", value: 35, color: "#ea580c" },
];

const kategoriNasabah = [
  { label: "Siswa", value: "218", change: "+6%", icon: GraduationCap, color: "#1120f0" },
  { label: "Guru", value: "64", change: "+2%", icon: BookUser, color: "#f59e0b" },
  { label: "Umum", value: "60", change: "-1%", icon: Users, color: "#10b981" },
];

const topNasabah = [
  { name: "Siswa Contoh", jenis: "Siswa", total: 24, color: "#1120f0" },
  { name: "Guru Contoh", jenis: "Guru", total: 18, color: "#f59e0b" },
  { name: "Ahmad Fauzi", jenis: "Siswa", total: 15, color: "#1120f0" },
  { name: "Budi Santoso", jenis: "Umum", total: 11, color: "#10b981" },
];

const NASABAH_POOL = [
  { nama: "Siswa Contoh", noRekening: "BM2607230001" },
  { nama: "Guru Contoh", noRekening: "BM2607230002" },
  { nama: "Ahmad Fauzi", noRekening: "BM2607230003" },
  { nama: "Budi Santoso", noRekening: "BM2607230004" },
];

function buildTransaksiRows(rows: { label: string; setor: number; tarik: number }[]) {
  return rows.flatMap((r, i) => {
    const setorNasabah = NASABAH_POOL[i % NASABAH_POOL.length];
    const tarikNasabah = NASABAH_POOL[(i + 1) % NASABAH_POOL.length];
    const ref = r.label.replace(/\s+/g, "").slice(0, 3).toUpperCase();
    return [
      {
        Tanggal: r.label,
        "No Transaksi": `TRX-${ref}-S${i + 1}`,
        Nasabah: setorNasabah.nama,
        "No Rekening": setorNasabah.noRekening,
        Jenis: "Setor",
        "Jumlah (Rp)": Math.round(r.setor * 1_000_000),
        Keterangan: "Setoran tunai",
      },
      {
        Tanggal: r.label,
        "No Transaksi": `TRX-${ref}-T${i + 1}`,
        Nasabah: tarikNasabah.nama,
        "No Rekening": tarikNasabah.noRekening,
        Jenis: "Tarik",
        "Jumlah (Rp)": Math.round(r.tarik * 1_000_000),
        Keterangan: "Penarikan tunai",
      },
    ];
  });
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

function StatCard({ label, value, change, trend, icon: Icon, caption, gradient }: Stat) {
  const up = trend === "up";
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft transition-shadow hover:shadow-lg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
      />
      <div className="relative mb-4 flex items-start justify-between">
        <motion.span
          initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.1, rotate: 8 }}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-sm ${gradient}`}
        >
          <Icon size={19} />
        </motion.span>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            up ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
          }`}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {change}
        </span>
      </div>
      <p className="relative text-sm text-text-secondary">{label}</p>
      <p className="relative mt-1 text-sm font-bold wrap-break-word text-text-primary sm:text-lg lg:text-2xl">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-text-muted">{caption}</p>
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="rounded-3xl bg-background-card p-6 shadow-soft"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-text-primary">{title}</h2>
            <p className="text-xs text-text-secondary">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </motion.div>
  );
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const setor = payload.find((p) => p.dataKey === "setor")?.value ?? 0;
  const tarik = payload.find((p) => p.dataKey === "tarik")?.value ?? 0;
  return (
    <div className="rounded-xl border border-border bg-background-card px-4 py-3 text-xs text-text-primary shadow-lg">
      <p className="mb-1.5 font-semibold">{label}</p>
      <p className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Setor: {setor} juta
      </p>
      <p className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-orange-to" />
        Tarik: {tarik} juta
      </p>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; value: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-background-card px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-text-primary">
        {item.name} {item.value}%
      </p>
    </div>
  );
}

const DOWNLOAD_OPTIONS = [
  {
    key: "harian" as const,
    label: "Harian",
    caption: "7 hari terakhir",
    icon: CalendarDays,
    gradient: "from-primary to-primary-dark",
  },
  {
    key: "mingguan" as const,
    label: "Mingguan",
    caption: "4 minggu terakhir",
    icon: CalendarRange,
    gradient: "from-gradient-green-from to-gradient-green-to",
  },
  {
    key: "bulanan" as const,
    label: "Bulanan",
    caption: "12 bulan terakhir",
    icon: CalendarCheck2,
    gradient: "from-gradient-orange-from to-gradient-orange-to",
  },
];

export function LaporanPageContent() {
  const [period, setPeriod] = useState<"6" | "12">("6");
  const [downloadingPeriod, setDownloadingPeriod] = useState<
    "harian" | "mingguan" | "bulanan" | null
  >(null);
  const barData = period === "6" ? barData6 : barData12;

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleDownload(p: "harian" | "mingguan" | "bulanan") {
    setDownloadingPeriod(p);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const rows =
        p === "harian"
          ? dailyData
          : p === "mingguan"
            ? weeklyData
            : barData12.map((r) => ({ label: r.month, setor: r.setor, tarik: r.tarik }));

      const periodLabel = DOWNLOAD_OPTIONS.find((o) => o.key === p)!;

      downloadExcel(
        [
          {
            name: "Ringkasan",
            rows: [
              { Ringkasan: "Periode Laporan", Nilai: `${periodLabel.label} (${periodLabel.caption})` },
              { Ringkasan: "Tanggal Dibuat", Nilai: today },
              ...stats.map((s) => ({ Ringkasan: s.label, Nilai: s.value })),
            ],
          },
          {
            name: "Tren Transaksi",
            rows: rows.map((r) => ({
              Periode: r.label,
              "Setor (Rp)": Math.round(r.setor * 1_000_000),
              "Tarik (Rp)": Math.round(r.tarik * 1_000_000),
            })),
          },
          {
            name: "Nasabah Teraktif",
            rows: topNasabah.map((n) => ({
              Nama: n.name,
              Jenis: n.jenis,
              "Jumlah Transaksi": n.total,
            })),
          },
          {
            name: "Detail Transaksi",
            rows: buildTransaksiRows(rows),
          },
        ],
        `laporan-${p}-bankmini-${Date.now()}.xlsx`,
      );
      toast.success(`Laporan ${periodLabel.label.toLowerCase()} berhasil diunduh`);
    } finally {
      setDownloadingPeriod(null);
    }
  }

  return (
    <Layout>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        className="mb-4 grid grid-cols-2 gap-4 md:mb-6 2xl:mb-7.5"
      >
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </motion.div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3 md:mb-6 2xl:mb-7.5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-3xl bg-background-card p-6 shadow-soft lg:col-span-2"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ArrowLeftRight size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">Perbandingan Periode</p>
            <p className="text-xs text-text-secondary">Bulan ini dibandingkan bulan lalu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[
            {
              label: "Setoran",
              icon: ArrowDownToLine,
              color: "#22c55e",
              ...perbandinganPeriode.setoran,
            },
            {
              label: "Penarikan",
              icon: ArrowUpFromLine,
              color: "#ea580c",
              ...perbandinganPeriode.penarikan,
            },
          ].map((item) => {
            const change = ((item.sekarang - item.sebelumnya) / item.sebelumnya) * 100;
            const up = change >= 0;
            const maxVal = Math.max(item.sekarang, item.sebelumnya);
            return (
              <div key={item.label}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                    >
                      <item.icon size={14} />
                    </span>
                    {item.label}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      up ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    }`}
                  >
                    {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
                      <span>Bulan ini</span>
                      <span className="font-semibold text-text-primary">
                        {formatCurrency(item.sekarang)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-background-hover">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.sekarang / maxVal) * 100}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
                      <span>Bulan lalu</span>
                      <span className="font-semibold text-text-secondary">
                        {formatCurrency(item.sebelumnya)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-background-hover">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.sebelumnya / maxVal) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[14px_14px]"
        />
        <div className="relative mb-3 flex items-center gap-2.5">
          <motion.span
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm"
          >
            <FileSpreadsheet size={18} />
          </motion.span>
          <div>
            <p className="text-sm font-bold text-text-primary">Unduh Laporan Excel</p>
            <p className="text-[11px] text-text-secondary">
              Fitur unduh — ekspor data ke file .xlsx sesuai periode
            </p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-2">
          {DOWNLOAD_OPTIONS.map((opt) => {
            const isLoading = downloadingPeriod === opt.key;
            return (
              <motion.button
                key={opt.key}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={downloadingPeriod !== null}
                onClick={() => handleDownload(opt.key)}
                className={`flex flex-col items-center gap-1 rounded-xl bg-linear-to-br px-2 py-3 text-center text-white shadow-sm transition-opacity disabled:cursor-not-allowed ${
                  opt.gradient
                } ${downloadingPeriod && !isLoading ? "opacity-50" : ""}`}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <opt.icon size={16} />
                )}
                <span className="text-[11px] font-bold">{opt.label}</span>
                <span className="text-[9px] leading-tight text-white/75">{opt.caption}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="relative mt-3 flex items-center gap-1.5 text-[10px] text-text-muted">
          <Download size={11} className="shrink-0 text-primary" />
          Klik salah satu periode untuk langsung mengunduh file-nya
        </p>
      </motion.div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
        className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3 2xl:gap-7.5"
      >
        <div className="lg:col-span-2">
          <ChartCard
            title="Tren Transaksi Bulanan"
            subtitle="Perbandingan volume setoran vs penarikan (dalam juta rupiah)"
            icon={BarChart3}
            badge={
              <div className="flex gap-1 rounded-full bg-background-hover p-1">
                {(["6", "12"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      period === p
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {p} Bulan
                  </button>
                ))}
              </div>
            }
          >
            <div className="mb-4 flex items-center gap-4 text-xs font-medium text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                Setor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gradient-orange-to" />
                Tarik
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: "#1120f0", fillOpacity: 0.06 }} />
                <Bar dataKey="setor" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="tarik" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Komposisi Transaksi"
            subtitle="Proporsi setor vs tarik bulan ini"
            icon={PieChartIcon}
          >
            <div className="relative mx-auto h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={komposisi}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="65%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    cornerRadius={8}
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive
                    animationDuration={700}
                  >
                    {komposisi.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold text-text-primary">1.284</p>
                <p className="text-[11px] text-text-secondary">Total Transaksi</p>
                <span className="mt-1 flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
                  <TrendingUp size={10} />
                  +8,2%
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              {kategoriNasabah.map((cat) => {
                const Icon = cat.icon;
                const up = cat.change.startsWith("+");
                return (
                  <div key={cat.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5 text-sm text-text-primary">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${cat.color}1a`, color: cat.color }}
                      >
                        <Icon size={14} />
                      </span>
                      {cat.label}
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold text-text-primary">
                        {cat.value}
                      </span>
                      <span
                        className={`text-xs font-medium ${up ? "text-success" : "text-danger"}`}
                      >
                        {cat.change}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-2">
          <ChartCard
            title="Nasabah Teraktif"
            subtitle="Berdasarkan jumlah transaksi bulan ini"
            icon={Trophy}
          >
            <div className="space-y-4">
              {topNasabah.map((n, i) => {
                const percent = Math.round((n.total / topNasabah[0].total) * 100);
                return (
                  <div key={n.name} className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: n.color }}
                    >
                      {n.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {i === 0 && <Trophy size={12} className="mr-1 inline text-warning" />}
                          {n.name}
                        </p>
                        <span className="shrink-0 text-sm font-semibold text-text-primary">
                          {n.total} transaksi
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background-hover">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: n.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <div>
          <motion.div
            variants={cardVariants}
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br from-gradient-from via-gradient-via to-gradient-to p-6 text-white shadow-soft"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-size-[16px_16px]"
            />
            <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <Wallet size={18} />
              </span>
              <h2 className="mt-3 text-lg font-semibold">Ringkasan Cepat</h2>
              <p className="mt-1 text-sm text-white/70">
                Data pada halaman ini adalah contoh tampilan (mock) untuk demonstrasi desain —
                belum terhubung ke endpoint laporan sungguhan.
              </p>
            </div>
            <div className="relative mt-6 flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold backdrop-blur-sm">
              <TrendingUp size={16} />
              Pertumbuhan transaksi +8,2% bulan ini
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
