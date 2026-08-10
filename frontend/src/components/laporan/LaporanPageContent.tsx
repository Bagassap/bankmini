"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { notify } from "@/store/notifyStore";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Download,
  FileText,
  Landmark,
  Loader2,
  PieChart as PieChartIcon,
  TrendingDown,
  TrendingUp,
  Users,
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
import api from "@/lib/api";
import { downloadLaporanPdf } from "@/lib/exportPdf";
import { getErrorMessage } from "@/lib/error";
import {
  formatCurrency,
  formatDate,
  formatFullDateID,
  getWibDateParts,
  startOfWibDay,
  startOfWibWeek,
} from "@/lib/format";
import { JENIS_ICON, jenisLabel } from "@/lib/transaksiMeta";
import type { JenisNasabah, Nasabah, Pengeluaran, Transaksi } from "@/lib/types";

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIcon;
  caption: string;
  gradient: string;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];
const JENIS_NASABAH_COLOR: Record<JenisNasabah, string> = {
  siswa: "#1120f0",
  guru: "#f59e0b",
  umum: "#10b981",
  kelas: "#8b5cf6",
  wali_kelas: "#0d9488",
};

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatPctChange(curr: number, prev: number): string {
  if (prev === 0) return curr === 0 ? "0%" : "Baru";
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

interface MonthBucket {
  key: string;
  month: string;
  setor: number;
  tarik: number;
}

function buildMonthlyBuckets(transaksi: Transaksi[], monthsBack: number): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), month: MONTH_LABELS[d.getMonth()], setor: 0, tarik: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const trx of transaksi) {
    const bucket = byKey.get(monthKey(new Date(trx.createdAt)));
    if (!bucket) continue;
    if (trx.jenisTransaksi === "setor") bucket.setor += Number(trx.jumlah);
    else bucket.tarik += Number(trx.jumlah);
  }
  return buckets;
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
      <p className="relative mt-1 text-sm font-bold wrap-break-word text-text-primary sm:text-lg lg:text-sm 2xl:text-2xl">
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
    caption: "Rekap hari ini",
    icon: CalendarDays,
    gradient: "from-primary to-primary-dark",
  },
  {
    key: "mingguan" as const,
    label: "Mingguan",
    caption: "Rekap minggu ini",
    icon: CalendarRange,
    gradient: "from-gradient-green-from to-gradient-green-to",
  },
  {
    key: "bulanan" as const,
    label: "Bulanan",
    caption: "Rekap bulan ini",
    icon: CalendarCheck2,
    gradient: "from-gradient-orange-from to-gradient-orange-to",
  },
];

export function LaporanPageContent() {
  const [period, setPeriod] = useState<"6" | "12">("6");
  const [downloadingPeriod, setDownloadingPeriod] = useState<
    "harian" | "mingguan" | "bulanan" | null
  >(null);
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const [nasabahRes, transaksiRes, pengeluaranRes] = await Promise.all([
          api.get<Nasabah[]>("/nasabah"),
          api.get<Transaksi[]>("/transaksi", {
            params: {
              from: toIsoDate(twelveMonthsAgo),
              to: toIsoDate(now),
              limit: 5000,
            },
          }),
          api.get<Pengeluaran[]>("/pengeluaran", {
            params: {
              from: toIsoDate(twelveMonthsAgo),
              to: toIsoDate(now),
              limit: 5000,
            },
          }),
        ]);
        setNasabahList(nasabahRes.data);
        setTransaksiList(transaksiRes.data);
        setPengeluaranList(pengeluaranRes.data);
      } catch (error) {
        notify.error(getErrorMessage(error, "Gagal memuat data laporan"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = formatFullDateID(new Date());

  const report = useMemo(() => {
    const buckets = buildMonthlyBuckets(transaksiList, 12);
    const thisMonth = buckets[buckets.length - 1];
    const lastMonth = buckets[buckets.length - 2] ?? { key: "", month: "", setor: 0, tarik: 0 };

    const thisMonthCount = transaksiList.filter(
      (t) => monthKey(new Date(t.createdAt)) === thisMonth.key,
    ).length;
    const lastMonthCount = transaksiList.filter(
      (t) => monthKey(new Date(t.createdAt)) === lastMonth.key,
    ).length;

    const totalVolumeBulanIni = thisMonth.setor + thisMonth.tarik;
    const setorShare =
      totalVolumeBulanIni > 0 ? Math.round((thisMonth.setor / totalVolumeBulanIni) * 100) : 50;

    const aktifCount = nasabahList.filter((n) => n.status === "aktif").length;
    const totalNasabahCount = nasabahList.length;

    const jenisCounts = new Map<JenisNasabah, number>();
    for (const n of nasabahList) {
      jenisCounts.set(n.jenisNasabah, (jenisCounts.get(n.jenisNasabah) ?? 0) + 1);
    }
    const kategoriNasabah = Array.from(jenisCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([jenis, count]) => ({
        jenis,
        count,
        share: totalNasabahCount > 0 ? Math.round((count / totalNasabahCount) * 100) : 0,
      }));

    const pengeluaranThisMonth = pengeluaranList
      .filter((p) => monthKey(new Date(p.createdAt)) === thisMonth.key)
      .reduce((sum, p) => sum + Number(p.jumlah), 0);
    const pengeluaranLastMonth = pengeluaranList
      .filter((p) => monthKey(new Date(p.createdAt)) === lastMonth.key)
      .reduce((sum, p) => sum + Number(p.jumlah), 0);

    return {
      buckets,
      thisMonth,
      lastMonth,
      thisMonthCount,
      lastMonthCount,
      setorShare,
      aktifCount,
      totalNasabahCount,
      kategoriNasabah,
      pengeluaranThisMonth,
      pengeluaranLastMonth,
    };
  }, [transaksiList, nasabahList, pengeluaranList]);

  const barData12 = useMemo(
    () =>
      report.buckets.map((b) => ({
        month: b.month,
        setor: Math.round((b.setor / 1_000_000) * 100) / 100,
        tarik: Math.round((b.tarik / 1_000_000) * 100) / 100,
      })),
    [report.buckets],
  );
  const barData6 = useMemo(() => barData12.slice(-6), [barData12]);
  const barData = period === "6" ? barData6 : barData12;

  const trenSummary = useMemo(() => {
    if (barData.length === 0) {
      return { avgSetor: 0, avgTarik: 0, topMonth: "-", topValue: 0 };
    }
    const avgSetor = barData.reduce((sum, b) => sum + b.setor, 0) / barData.length;
    const avgTarik = barData.reduce((sum, b) => sum + b.tarik, 0) / barData.length;
    const top = barData.reduce(
      (max, b) => (b.setor + b.tarik > max.setor + max.tarik ? b : max),
      barData[0],
    );
    return { avgSetor, avgTarik, topMonth: top.month, topValue: top.setor + top.tarik };
  }, [barData]);

  const stats: Stat[] = useMemo(
    () => [
      {
        label: "Total Transaksi",
        value: String(report.thisMonthCount),
        change: formatPctChange(report.thisMonthCount, report.lastMonthCount),
        trend: report.thisMonthCount >= report.lastMonthCount ? "up" : "down",
        icon: Landmark,
        caption: "Transaksi bulan ini",
        gradient: "from-primary to-primary-dark",
      },
      {
        label: "Total Setoran",
        value: formatCurrency(report.thisMonth.setor),
        change: formatPctChange(report.thisMonth.setor, report.lastMonth.setor),
        trend: report.thisMonth.setor >= report.lastMonth.setor ? "up" : "down",
        icon: ArrowDownToLine,
        caption: "Setoran tunai masuk",
        gradient: "from-gradient-green-from to-gradient-green-to",
      },
      {
        label: "Total Penarikan",
        value: formatCurrency(report.thisMonth.tarik),
        change: formatPctChange(report.thisMonth.tarik, report.lastMonth.tarik),
        trend: report.thisMonth.tarik >= report.lastMonth.tarik ? "up" : "down",
        icon: ArrowUpFromLine,
        caption: "Penarikan tunai keluar",
        gradient: "from-gradient-orange-from to-gradient-orange-to",
      },
      {
        label: "Pengeluaran Operasional",
        value: formatCurrency(report.pengeluaranThisMonth),
        change: formatPctChange(report.pengeluaranThisMonth, report.pengeluaranLastMonth),
        trend: report.pengeluaranThisMonth >= report.pengeluaranLastMonth ? "up" : "down",
        icon: TrendingDown,
        caption: "Kas keluar operasional",
        gradient: "from-gradient-purple-from to-gradient-purple-to",
      },
      {
        label: "Nasabah Aktif",
        value: String(report.aktifCount),
        change: `${
          report.totalNasabahCount > 0
            ? Math.round((report.aktifCount / report.totalNasabahCount) * 100)
            : 0
        }% aktif`,
        trend: "up",
        icon: Users,
        caption: `Dari ${report.totalNasabahCount} total nasabah`,
        gradient: "from-gradient-blue-from to-gradient-blue-to",
      },
    ],
    [report],
  );

  const komposisi = [
    { name: "Setor", value: report.setorShare, color: "#22c55e" },
    { name: "Tarik", value: 100 - report.setorShare, color: "#ea580c" },
  ];

  async function handleDownload(p: "harian" | "mingguan" | "bulanan") {
    setDownloadingPeriod(p);
    try {
      const { year, month, day } = getWibDateParts();
      let rangeStart: Date;
      if (p === "harian") {
        rangeStart = startOfWibDay(year, month, day);
      } else if (p === "mingguan") {
        const monday = startOfWibWeek(year, month, day);
        rangeStart = startOfWibDay(monday.year, monday.month, monday.day);
      } else {
        rangeStart = startOfWibDay(year, month, 1);
      }

      const filtered = transaksiList
        .filter((t) => new Date(t.createdAt) >= rangeStart)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const periodLabel = DOWNLOAD_OPTIONS.find((o) => o.key === p)!;

      await downloadLaporanPdf(
        {
          title: "Laporan Keuangan",
          periodeLabel: `${periodLabel.label} (${periodLabel.caption})`,
          dicetakLabel: today,
          rows: filtered.map((t) => ({
            tanggal: formatDate(t.createdAt),
            jenis: t.jenisTransaksi,
            keterangan: t.keterangan ?? "-",
            nasabah: t.nasabah?.nama ?? "-",
            jumlah: Number(t.jumlah),
          })),
        },
        `laporan-${p}-bankmini-${Date.now()}.pdf`,
      );
      notify.success(`Laporan ${periodLabel.label.toLowerCase()} berhasil diunduh`);
    } catch (error) {
      notify.error(getErrorMessage(error, "Gagal mengunduh laporan"));
    } finally {
      setDownloadingPeriod(null);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-2 py-24 text-text-secondary">
          <Loader2 size={26} className="animate-spin text-primary" />
          Memuat data laporan...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:mb-6 lg:grid-cols-5 2xl:mb-7.5"
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
                sekarang: report.thisMonth.setor,
                sebelumnya: report.lastMonth.setor,
              },
              {
                label: "Penarikan",
                icon: ArrowUpFromLine,
                color: "#ea580c",
                sekarang: report.thisMonth.tarik,
                sebelumnya: report.lastMonth.tarik,
              },
            ].map((item) => {
              const change =
                item.sebelumnya > 0
                  ? ((item.sekarang - item.sebelumnya) / item.sebelumnya) * 100
                  : item.sekarang > 0
                    ? 100
                    : 0;
              const up = change >= 0;
              const maxVal = Math.max(item.sekarang, item.sebelumnya, 1);
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
              <FileText size={18} />
            </motion.span>
            <div>
              <p className="text-sm font-bold text-text-primary">Unduh Laporan PDF</p>
              <p className="text-[11px] text-text-secondary">
                Ekspor rincian pendapatan &amp; pengeluaran ke file .pdf sesuai periode
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
        className="grid grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-3 2xl:gap-7.5"
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

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div className="rounded-xl bg-success/10 p-3 text-center">
                <p className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                  <ArrowDownToLine size={11} className="text-success" />
                  Rata-rata Setor
                </p>
                <p className="mt-1 text-sm font-bold text-success">
                  {trenSummary.avgSetor.toFixed(1)} juta
                </p>
              </div>
              <div className="rounded-xl bg-danger/10 p-3 text-center">
                <p className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                  <ArrowUpFromLine size={11} className="text-danger" />
                  Rata-rata Tarik
                </p>
                <p className="mt-1 text-sm font-bold text-danger">
                  {trenSummary.avgTarik.toFixed(1)} juta
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3 text-center">
                <p className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
                  <TrendingUp size={11} className="text-primary" />
                  Bulan Tertinggi
                </p>
                <p className="mt-1 text-sm font-bold text-primary">{trenSummary.topMonth}</p>
              </div>
            </div>
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Komposisi Transaksi"
            subtitle="Proporsi setor vs tarik bulan ini"
            icon={PieChartIcon}
          >
            <div className="relative mx-auto h-44 w-44">
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
                <p className="text-xl font-bold text-text-primary">{report.thisMonthCount}</p>
                <p className="text-[11px] text-text-secondary">Total Transaksi</p>
                <span
                  className={`mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    report.thisMonthCount >= report.lastMonthCount
                      ? "bg-success/15 text-success"
                      : "bg-danger/15 text-danger"
                  }`}
                >
                  {report.thisMonthCount >= report.lastMonthCount ? (
                    <TrendingUp size={10} />
                  ) : (
                    <TrendingDown size={10} />
                  )}
                  {formatPctChange(report.thisMonthCount, report.lastMonthCount)}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
              {report.kategoriNasabah.length === 0 ? (
                <p className="col-span-2 text-center text-xs text-text-muted">
                  Belum ada data nasabah
                </p>
              ) : (
                report.kategoriNasabah.map((cat) => {
                  const Icon = JENIS_ICON[cat.jenis];
                  const color = JENIS_NASABAH_COLOR[cat.jenis];
                  return (
                    <div
                      key={cat.jenis}
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
                        <p className="truncate text-xs font-semibold text-text-secondary">
                          {jenisLabel[cat.jenis]}
                        </p>
                        <p className="flex items-baseline gap-1 whitespace-nowrap">
                          <span className="text-sm font-bold text-text-primary">{cat.count}</span>
                          <span className="text-[11px] font-medium text-text-muted">
                            ({cat.share}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Users size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary">{report.totalNasabahCount}</p>
                  <p className="truncate text-[10px] text-text-muted">Total Nasabah</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-success/10 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
                  <CheckCircle2 size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary">{report.aktifCount}</p>
                  <p className="truncate text-[10px] text-text-muted">Nasabah Aktif</p>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

      </motion.div>
    </Layout>
  );
}
