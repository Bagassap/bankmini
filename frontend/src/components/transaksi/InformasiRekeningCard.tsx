"use client";

import { Building2, Landmark, Loader2, Search, Tag, UserCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { JENIS_ICON, jenisLabel } from "@/lib/transaksiMeta";
import type { Nasabah } from "@/lib/types";

export function InformasiRekeningCard({
  noRekening,
  onNoRekeningChange,
  onSubmit,
  searching,
  nasabah,
  suggestions = [],
  suggestionsLoading = false,
  onSelectSuggestion,
}: {
  noRekening: string;
  onNoRekeningChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  searching: boolean;
  nasabah: Nasabah | null;
  suggestions?: Nasabah[];
  suggestionsLoading?: boolean;
  onSelectSuggestion?: (nasabah: Nasabah) => void;
}) {
  const showDropdown = !nasabah && (suggestions.length > 0 || suggestionsLoading);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-background-card p-5 shadow-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(17,32,240,0.9)_1px,transparent_1px)] bg-size-[16px_16px]"
      />
      <div className="relative mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-sm">
            <UserCircle2 size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">Informasi Rekening</p>
            <p className="text-xs text-text-secondary">
              Verifikasi identitas nasabah sebelum transaksi
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-background-hover px-2.5 py-1 text-[10px] font-bold whitespace-nowrap text-text-muted">
          LANGKAH 1
        </span>
      </div>

      <form onSubmit={onSubmit} className="relative mb-4">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
          <Landmark size={12} className="text-primary" />
          Nomor Rekening atau Nama Nasabah
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Building2
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={noRekening}
              onChange={(e) => onNoRekeningChange(e.target.value)}
              placeholder="Contoh: 0981223445 atau nama nasabah"
              autoComplete="off"
              className="w-full rounded-xl border border-transparent bg-background-hover py-2.5 pr-3 pl-9 text-sm text-text-primary transition-shadow focus:border-primary focus:bg-background-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-border bg-background-card shadow-soft"
                >
                  {suggestionsLoading ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-xs text-text-secondary">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      Mencari nasabah...
                    </div>
                  ) : (
                    suggestions.map((item) => {
                      const Icon = JENIS_ICON[item.jenisNasabah];
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectSuggestion?.(item)}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-background-hover"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-text-primary">
                              {item.nama}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
                              {item.noRekening}
                              <span className="text-text-muted/60">&middot;</span>
                              {jenisLabel[item.jenisNasabah]}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={searching}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {searching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            {searching ? "Mencari..." : "Cari Data"}
          </motion.button>
        </div>
        <p className="mt-1.5 text-[11px] text-text-muted">
          Ketik nama untuk melihat saran, atau tekan Enter untuk pencarian No Rekening persis
        </p>
      </form>

      <div className="relative grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <UserCircle2 size={12} className="text-primary" /> Nama Pemilik
          </label>
          <div className="truncate rounded-xl bg-background-hover px-3 py-2.5 text-sm font-semibold text-text-primary">
            {nasabah ? nasabah.nama : <span className="text-text-muted">-</span>}
          </div>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Tag size={12} className="text-primary" /> Tipe Layanan
          </label>
          <div className="rounded-xl bg-background-hover px-3 py-2.5 text-sm font-semibold text-text-primary">
            {nasabah ? (
              jenisLabel[nasabah.jenisNasabah]
            ) : (
              <span className="text-text-muted">-</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
