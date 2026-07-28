import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookUser,
  GraduationCap,
  Sparkles,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { JenisNasabah } from "@/lib/types";

export const jenisLabel: Record<JenisNasabah, string> = {
  siswa: "Siswa",
  guru: "Guru",
  umum: "Umum",
};

export const JENIS_ICON: Record<JenisNasabah, LucideIcon> = {
  siswa: GraduationCap,
  guru: BookUser,
  umum: Users,
};

export const GUIDE_COLORS = ["#1120f0", "#22c55e", "#ea580c"];

export interface TransaksiMeta {
  tab: "setor" | "tarik";
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  text: string;
  gradient: string;
  icon: LucideIcon;
  submitLabel: string;
  sumberLabel: string;
  sumberIcon: LucideIcon;
  sumberOptions: string[];
  tips: string[];
}

export const SETOR_META: TransaksiMeta = {
  tab: "setor",
  title: "Setor Tunai",
  subtitle: "Layanan setoran tunai real-time ke rekening nasabah Bank Mini Nusa.",
  color: "#10b981",
  bg: "bg-success/10",
  text: "text-success",
  gradient: "from-gradient-green-from to-gradient-green-to",
  icon: ArrowDownToLine,
  submitLabel: "Proses Setoran",
  sumberLabel: "Sumber Dana",
  sumberIcon: Sparkles,
  sumberOptions: ["Pendapatan Pribadi", "Uang Saku", "Bantuan Orang Tua", "Lainnya"],
  tips: [
    "Hitung uang di depan nasabah menggunakan mesin penghitung.",
    "Pastikan tidak ada uang palsu (3D: Dilihat, Diraba, Diterawang).",
    "Verifikasi KTP jika setoran di atas Rp 10 juta.",
  ],
};

export const TARIK_META: TransaksiMeta = {
  tab: "tarik",
  title: "Tarik Tunai",
  subtitle: "Layanan penarikan tunai real-time dari rekening nasabah Bank Mini Nusa.",
  color: "#ea580c",
  bg: "bg-warning/15",
  text: "text-orange-600",
  gradient: "from-gradient-orange-from to-gradient-orange-to",
  icon: ArrowUpFromLine,
  submitLabel: "Proses Penarikan",
  sumberLabel: "Tujuan Penarikan",
  sumberIcon: Tag,
  sumberOptions: ["Kebutuhan Pribadi", "Biaya Sekolah", "Bayar Kegiatan", "Lainnya"],
  tips: [
    "Pastikan saldo nasabah mencukupi sebelum penarikan.",
    "Cocokkan identitas nasabah dengan data rekening.",
    "Hitung ulang uang fisik sebelum diserahkan ke nasabah.",
  ],
};
