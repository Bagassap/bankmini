"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import { JENIS_ICON, jenisLabel } from "@/lib/transaksiMeta";
import logoMark from "@/assets/logo-mark.png";
import type { Nasabah } from "@/lib/types";

// Groups the "BM260801 0001"-style noRekening into 4-character blocks so it
// reads like a real card number - it's whatever length noRekening happens
// to be, not a fixed 16 digits, so this works off the actual string rather
// than assuming a card-standard length.
function groupNoRekening(noRekening: string): string[] {
  return noRekening.match(/.{1,4}/g) ?? [noRekening];
}

// Standalone virtual card, sized like a real debit card (ISO/IEC 7810 ID-1
// ratio, 85.6mm x 54mm ~= 1.586:1) - kept as its own card element so it can
// sit beside the Saldo Saat Ini card in the same row instead of being
// nested inside it. Shared by every nasabah "role" (siswa/guru/umum/kelas/
// wali_kelas) and dual-role staff since they all render the same portal
// dashboard - styled deliberately busy/layered like a modern m-banking
// card (rings, foil sweep, watermark, sparkles) rather than a flat rectangle.
export function AtmCard({ nasabah }: { nasabah: Nasabah }) {
  const [revealed, setRevealed] = useState(false);

  const groups = groupNoRekening(nasabah.noRekening);
  const displayGroups = revealed
    ? groups
    : groups.map((g, i) => (i === groups.length - 1 ? g : "••••"));

  const JenisIcon = JENIS_ICON[nasabah.jenisNasabah];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-primary-dark p-5 text-white shadow-soft ring-1 ring-white/15"
    >
      {/* Layered background texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-size-[14px_14px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle,rgba(255,255,255,0.9)_1.5px,transparent_1.5px)] bg-size-[42px_42px]"
      />

      {/* Concentric sunburst rings, top-right */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 text-white/10"
      >
        <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="54" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="32" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>

      <p
        aria-hidden
        className="pointer-events-none absolute -bottom-4 left-1/2 w-full -translate-x-1/2 rotate-[-3deg] text-center text-[38px] leading-none font-black tracking-widest text-white/[0.08] select-none sm:text-[46px]"
      >
        NUSA
      </p>

      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-white/15 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-1/4 h-24 w-24 rounded-full bg-gradient-blue-from/25 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/4 left-1/3 h-16 w-16 rounded-full bg-gradient-green-from/20 blur-xl"
      />

      {/* Holographic diagonal foil sweep */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-y-8 -left-1/4 w-1/4 -rotate-12 bg-linear-to-r from-white/0 via-white/20 to-white/0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-y-8 left-1/2 w-[10%] -rotate-12 bg-linear-to-r from-white/0 via-gradient-green-from/25 to-white/0"
      />

      {/* Scattered sparkle accents */}
      <Sparkles
        aria-hidden
        size={12}
        className="pointer-events-none absolute top-[38%] right-[18%] text-white/25"
      />
      <Sparkles
        aria-hidden
        size={8}
        className="pointer-events-none absolute top-[22%] right-[38%] text-white/20"
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <motion.span
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
          >
            <Image src={logoMark} alt="" className="h-4.5 w-auto object-contain" />
          </motion.span>
          <div>
            <p className="text-[11px] leading-tight font-bold [text-shadow:0_1px_2px_rgba(0,0,0,0.15)]">
              BANK MINI NUSA
            </p>
            <p className="flex items-center gap-1 text-[8.5px] leading-tight text-white/70">
              <span className="relative flex h-1.5 w-1.5">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="absolute inline-flex h-full w-full rounded-full bg-success"
                />
              </span>
              Kartu Virtual Aktif
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold ring-1 ring-white/20 backdrop-blur-sm">
          <JenisIcon size={10} />
          {jenisLabel[nasabah.jenisNasabah]}
        </span>
      </div>

      <div className="relative flex items-center gap-2.5">
        <span
          aria-hidden
          className="relative h-7 w-9 overflow-hidden rounded-md bg-linear-to-br from-yellow-200 via-yellow-300 to-yellow-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]"
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-yellow-700/40" />
          <span className="absolute inset-y-0 left-1/3 w-px bg-yellow-700/40" />
          <span className="absolute inset-y-0 left-2/3 w-px bg-yellow-700/40" />
          <span className="absolute inset-x-[15%] top-[15%] h-[30%] rounded-sm border border-yellow-700/30" />
        </span>
        <Wifi aria-hidden size={16} className="rotate-90 text-white/80" />
        <ShieldCheck aria-hidden size={13} className="text-white/50" />
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-mono text-lg font-bold tracking-wider [text-shadow:0_1px_3px_rgba(0,0,0,0.2)] sm:text-xl">
            {displayGroups.map((g, i) => (
              <span key={i}>{g}</span>
            ))}
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-white/80 ring-1 ring-white/20 transition-colors hover:bg-white/25 hover:text-white"
              aria-label={revealed ? "Sembunyikan nomor rekening" : "Tampilkan nomor rekening"}
            >
              {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          <p className="mt-1.5 truncate text-[10px] tracking-wide text-white/60 uppercase">
            {nasabah.nama}
          </p>
        </div>

        {/* Original abstract network mark - not a trademarked payment logo */}
        <div aria-hidden className="relative flex h-7 w-11 shrink-0 items-center">
          <span className="absolute right-4 h-6 w-6 rounded-full bg-white/45 mix-blend-screen" />
          <span className="absolute right-0 h-6 w-6 rounded-full bg-gradient-green-from/50 mix-blend-screen" />
        </div>
      </div>
    </motion.div>
  );
}
