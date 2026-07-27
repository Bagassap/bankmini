"use client";

import { useEffect, useState } from "react";

/** Jam real-time, mulai null agar render pertama (SSR) sama dengan client sebelum mount. */
export function useLiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return now;
}
