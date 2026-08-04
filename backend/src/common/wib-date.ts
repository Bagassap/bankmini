// Every "what calendar day is it" calculation in this app must follow WIB
// (Asia/Jakarta, UTC+7) regardless of the server's own system timezone -
// the host runs in UTC, but the bank operates on Indonesian wall-clock time.
// All helpers here work off a UTC instant shifted by this offset, then read
// back with UTC getters, so the result is correct no matter what timezone
// the host happens to be configured with.
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface WibDateParts {
  year: number;
  month: number; // 0-indexed, matches Date's getMonth()
  day: number;
}

export function wibDateParts(reference: Date = new Date()): WibDateParts {
  const shifted = new Date(reference.getTime() + WIB_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

// Start of the WIB calendar day containing `reference`, as a real UTC instant.
export function startOfWibDay(reference: Date = new Date()): Date {
  const { year, month, day } = wibDateParts(reference);
  return new Date(Date.UTC(year, month, day) - WIB_OFFSET_MS);
}

// Exclusive end (start of the next WIB day) - use with `lt`, not `lte`.
export function endOfWibDayExclusive(reference: Date = new Date()): Date {
  const { year, month, day } = wibDateParts(reference);
  return new Date(Date.UTC(year, month, day + 1) - WIB_OFFSET_MS);
}

// Start of the WIB calendar month containing `reference`, as a real UTC instant.
export function startOfWibMonth(reference: Date = new Date()): Date {
  const { year, month } = wibDateParts(reference);
  return new Date(Date.UTC(year, month, 1) - WIB_OFFSET_MS);
}

// Exclusive end (start of the next WIB month) - use with `lt`, not `lte`.
export function endOfWibMonthExclusive(reference: Date = new Date()): Date {
  const { year, month } = wibDateParts(reference);
  return new Date(Date.UTC(year, month + 1, 1) - WIB_OFFSET_MS);
}

// A bare "YYYY-MM-DD" query param (e.g. from an <input type="date">) is
// parsed by `new Date(str)` as UTC midnight of that calendar day - its Y-M-D
// digits are exactly what the user typed, so reading them back with UTC
// getters recovers the intended day untouched by any offset. Use this (not
// startOfWibDay/endOfWibDayExclusive, which shift by +7h first) whenever the
// input is already a specific calendar day rather than a live instant -
// shifting first could roll it onto the wrong date.
export function wibDayRangeFromDateOnly(dateOnlyUtcMidnight: Date): {
  start: Date;
  end: Date;
} {
  const year = dateOnlyUtcMidnight.getUTCFullYear();
  const month = dateOnlyUtcMidnight.getUTCMonth();
  const day = dateOnlyUtcMidnight.getUTCDate();
  return {
    start: new Date(Date.UTC(year, month, day) - WIB_OFFSET_MS),
    end: new Date(Date.UTC(year, month, day + 1) - WIB_OFFSET_MS),
  };
}
