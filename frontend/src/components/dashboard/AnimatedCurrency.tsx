"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue } from "framer-motion";
import { formatCurrency } from "@/lib/format";

export function AnimatedCurrency({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);

  useEffect(() => {
    if (spanRef.current) {
      spanRef.current.textContent = formatCurrency(0);
    }
    const controls = animate(motionVal, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (spanRef.current) {
          spanRef.current.textContent = formatCurrency(Math.round(v));
        }
      },
    });
    return controls.stop;
  }, [value]);

  return (
    <span ref={spanRef} className={className}>
      {formatCurrency(0)}
    </span>
  );
}
