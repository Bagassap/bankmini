"use client";

import { ArrowRight, Calendar, CalendarRange } from "lucide-react";

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateID(isoDate: string): string {
  if (!isoDate) return "--/--/----";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

const PRESETS: { label: string; getRange: () => { from: string; to: string } }[] = [
  {
    label: "Hari Ini",
    getRange: () => {
      const today = toIso(new Date());
      return { from: today, to: today };
    },
  },
  {
    label: "Minggu Ini",
    getRange: () => ({
      from: toIso(startOfWeek(new Date())),
      to: toIso(new Date()),
    }),
  },
  {
    label: "Bulan Ini",
    getRange: () => ({
      from: toIso(startOfMonth(new Date())),
      to: toIso(new Date()),
    }),
  },
];

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  function applyPreset(getRange: () => { from: string; to: string }) {
    const range = getRange();
    onFromChange(range.from);
    onToChange(range.to);
  }

  return (
    <div className="relative">
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-white/70 uppercase tracking-wide">
        <CalendarRange size={11} />
        Rentang Tanggal
      </label>

      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="pointer-events-none flex flex-col gap-0.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm transition-colors peer-hover:bg-white/15 peer-focus:border-white/50">
            <span className="text-[9px] font-bold text-white/60 uppercase">Dari</span>
            <span className="font-mono text-sm font-bold text-white">{formatDateID(from)}</span>
          </div>
        </div>

        <div className="relative">
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <div className="pointer-events-none flex flex-col gap-0.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm transition-colors peer-hover:bg-white/15 peer-focus:border-white/50">
            <span className="text-[9px] font-bold text-white/60 uppercase">Sampai</span>
            <span className="font-mono text-sm font-bold text-white">{formatDateID(to)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset.getRange)}
            className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/20"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-[11px] text-white/80">
        <Calendar size={12} className="shrink-0" />
        <span className="font-mono">{formatDateID(from)}</span>
        <ArrowRight size={10} className="shrink-0" />
        <span className="font-mono">{formatDateID(to)}</span>
      </div>
    </div>
  );
}
