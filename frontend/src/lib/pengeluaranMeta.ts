import {
  BookOpenText,
  Coffee,
  MoreHorizontal,
  PenTool,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { KategoriPengeluaran } from "@/lib/types";

export const kategoriPengeluaranLabel: Record<KategoriPengeluaran, string> = {
  cetak_buku_tabungan: "Cetak Buku Tabungan",
  atk: "ATK & Perlengkapan",
  konsumsi: "Konsumsi & Rapat",
  perawatan: "Perawatan & Perbaikan",
  lainnya: "Lainnya",
};

export const KATEGORI_PENGELUARAN_ICON: Record<KategoriPengeluaran, LucideIcon> = {
  cetak_buku_tabungan: BookOpenText,
  atk: PenTool,
  konsumsi: Coffee,
  perawatan: Wrench,
  lainnya: MoreHorizontal,
};

export const KATEGORI_PENGELUARAN_COLOR: Record<KategoriPengeluaran, string> = {
  cetak_buku_tabungan: "#1120f0",
  atk: "#f59e0b",
  konsumsi: "#10b981",
  perawatan: "#8b5cf6",
  lainnya: "#6b7280",
};

export const KATEGORI_PENGELUARAN_OPTIONS: KategoriPengeluaran[] = [
  "cetak_buku_tabungan",
  "atk",
  "konsumsi",
  "perawatan",
  "lainnya",
];
