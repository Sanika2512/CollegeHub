"use client";

import { useEffect, useState } from "react";

export function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - start) / 900);
      setCount(Math.round(value * progress));
      if (progress === 1) window.clearInterval(timer);
    }, 24);
    return () => window.clearInterval(timer);
  }, [value]);
  return <span>{count.toLocaleString("en-IN")}{suffix}</span>;
}
