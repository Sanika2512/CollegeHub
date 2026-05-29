"use client";

import Link from "next/link";
import { useEffect } from "react";
import { GitCompare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCompareStore } from "@/lib/compare-store";

export function CompareDrawer() {
  const { ids, hydrate, clear } = useCompareStore();
  useEffect(() => {
    hydrate((localStorage.getItem("compareIds") ?? "").split(",").filter(Boolean).slice(0, 3));
  }, [hydrate]);
  if (ids.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 animate-[slideUp_.22s_ease-out] rounded-lg border bg-white p-3 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitCompare className="h-4 w-4 text-primary" />
          {ids.length} selected for comparison
        </div>
        <Link href={`/compare?ids=${ids.join(",")}`} onClick={clear}>
          <Button disabled={ids.length < 2}>Compare now</Button>
        </Link>
      </div>
    </div>
  );
}
