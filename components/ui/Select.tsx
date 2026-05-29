"use client";

import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("min-h-11 w-full rounded-md border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/20", className)} {...props}>
      {children}
    </select>
  );
}
