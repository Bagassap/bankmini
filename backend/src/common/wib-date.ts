export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface WibDateParts {
  year: number;
  month: number;
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

export function startOfWibDay(reference: Date = new Date()): Date {
  const { year, month, day } = wibDateParts(reference);
  return new Date(Date.UTC(year, month, day) - WIB_OFFSET_MS);
}

export function endOfWibDayExclusive(reference: Date = new Date()): Date {
  const { year, month, day } = wibDateParts(reference);
  return new Date(Date.UTC(year, month, day + 1) - WIB_OFFSET_MS);
}

export function startOfWibMonth(reference: Date = new Date()): Date {
  const { year, month } = wibDateParts(reference);
  return new Date(Date.UTC(year, month, 1) - WIB_OFFSET_MS);
}

export function endOfWibMonthExclusive(reference: Date = new Date()): Date {
  const { year, month } = wibDateParts(reference);
  return new Date(Date.UTC(year, month + 1, 1) - WIB_OFFSET_MS);
}

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
