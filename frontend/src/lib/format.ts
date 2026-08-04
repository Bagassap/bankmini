// All calendar/date/time display in this app must show WIB (Asia/Jakarta,
// UTC+7) regardless of the viewer's own device/browser timezone setting -
// pinning it explicitly here means every formatter that goes through this
// module stays correct even if a device is misconfigured.
const WIB_TIME_ZONE = "Asia/Jakarta";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: string | number): string {
  return currencyFormatter.format(Number(value));
}

// Formats a plain digit string as Indonesian-style thousands-separated
// number (e.g. "1000000" -> "1.000.000") for masked rupiah inputs.
export function formatDigitsID(digits: string): string {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

// Explicit Indonesian day/month/year numeric format (e.g. "29/07/2026 21.13"),
// as opposed to formatDate()'s abbreviated-month "medium" style.
export function formatDateID(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const datePart = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
  const timePart = new Intl.DateTimeFormat("id-ID", {
    timeStyle: "short",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
  return `${datePart} ${timePart} WIB`;
}

// Date-only Indonesian numeric format (e.g. "29/07/2026"), for date-range
// filter summaries where a browser's native <input type="date"> can't be
// forced to display in a specific locale.
export function formatDateOnlyID(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

export function formatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    timeStyle: "medium",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

// Full Indonesian weekday + date (e.g. "Sabtu, 1 Agustus 2026"), pinned to
// WIB so "today" reads correctly regardless of the viewer's device clock.
export function formatFullDateID(value: string | Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

// Long Indonesian date without weekday (e.g. "1 Agustus 2026").
export function formatLongDateID(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

// Month + year only (e.g. "Agustus 2026"), for "member since"-style labels.
export function formatMonthYearID(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

// Formats a pure calendar-date string ("YYYY-MM-DD", e.g. from an
// <input type="date">) as a long Indonesian date (e.g. "1 Agustus 2026").
// Parses the Y-M-D components directly and renders via UTC so the result
// never shifts by a day depending on the viewer's device timezone - unlike
// a timestamp, a bare calendar date has no time-of-day to convert from.
export function formatDateOnlyLongID(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

// Short "HH.mm" time (no seconds), e.g. for a "last updated at" label.
export function formatTimeShort(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: WIB_TIME_ZONE,
  }).format(date);
}

// The current hour on the WIB wall clock (0-23), independent of the
// viewer's own device/browser timezone - used for time-of-day greetings so
// "Selamat pagi/siang/sore/malam" always matches Indonesian local time.
export function getWibHour(value: string | Date = new Date()): number {
  const date = typeof value === "string" ? new Date(value) : value;
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: WIB_TIME_ZONE,
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart);
  return hour === 24 ? 0 : hour;
}

// The WIB calendar date (year, 0-indexed month, day) for a given instant -
// independent of the viewer's own device/browser timezone, so "today" for a
// date-range filter always matches Indonesian local time rather than
// whatever timezone the browser happens to be in.
export function getWibDateParts(value: Date = new Date()): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: WIB_TIME_ZONE,
  }).formatToParts(value);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

// The instant that is 00:00 WIB on the given WIB calendar date - midnight
// WIB is 17:00 UTC the previous day, which is what `Date.UTC` with a
// negative hour normalizes to automatically.
export function startOfWibDay(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, -7, 0, 0, 0));
}

// The most recent Monday on/before the given WIB calendar date, as WIB date
// parts - Indonesian weeks conventionally start on Monday, not Sunday.
export function startOfWibWeek(
  year: number,
  month: number,
  day: number,
): { year: number; month: number; day: number } {
  // A UTC-midnight Date carrying only the WIB calendar date (not a real
  // instant) so `getUTCDay()` reads the weekday without any timezone
  // reinterpretation.
  const calendarDate = new Date(Date.UTC(year, month, day));
  const dayOfWeek = calendarDate.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(Date.UTC(year, month, day - diffToMonday));
  return {
    year: monday.getUTCFullYear(),
    month: monday.getUTCMonth(),
    day: monday.getUTCDate(),
  };
}

const ROMAN_NUMERALS: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

// Converts a positive integer to a Roman numeral (e.g. "Pinjaman Ke" for
// Piutang Bulanan: 1 -> "I", 2 -> "II", ...). Falls back to the plain
// number for 0/negative input, which shouldn't occur for a loan sequence
// but keeps this safe to call defensively.
export function toRomanNumeral(value: number): string {
  if (!Number.isFinite(value) || value < 1) return String(value);
  let remaining = Math.floor(value);
  let result = "";
  for (const [amount, numeral] of ROMAN_NUMERALS) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}
