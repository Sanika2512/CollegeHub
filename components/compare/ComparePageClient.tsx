"use client";

import type { College } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CompareSlot } from "@/components/compare/CompareSlot";
import { CompareTable } from "@/components/compare/CompareTable";
import { useCompareStore } from "@/lib/compare-store";

export function ComparePageClient({ initialIds }: { initialIds: string[] }) {
  const router = useRouter();
  const clearCompare = useCompareStore((state) => state.clear);
  const [ids, setIds] = useState<string[]>(initialIds);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const localIds = (localStorage.getItem("compareIds") ?? "").split(",").filter(Boolean);
    const nextIds = initialIds.length ? initialIds : localIds;
    setIds(nextIds);
    clearCompare();
  }, [clearCompare, initialIds]);

  useEffect(() => {
    if (!ids.length) return;
    router.replace(`/compare?ids=${ids.join(",")}`, { scroll: false });
    if (ids.length < 2) {
      setColleges([]);
      return;
    }
    setLoading(true);
    fetch(`/api/compare?ids=${ids.join(",")}`)
      .then((response) => response.json())
      .then(setColleges)
      .catch(() => toast.error("Could not load comparison"))
      .finally(() => setLoading(false));
  }, [ids, router]);

  async function saveComparison() {
    const response = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    if (response.status === 401) return toast.error("Login to save comparisons");
    if (!response.ok) return toast.error("Could not save comparison");
    toast.success("Comparison saved");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Compare</p>
          <h1 className="font-display text-3xl font-black sm:text-4xl">College comparison</h1>
        </div>
        <Button className="w-full sm:w-auto" disabled={ids.length < 2} onClick={saveComparison}>Save comparison</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((slot) => <CompareSlot key={slot} college={colleges[slot]} />)}
      </div>
      {loading ? <div className="h-72 animate-pulse rounded-lg bg-slate-200" /> : ids.length < 2 ? <div className="rounded-lg border bg-white p-10 text-center text-slate-600">Add two or three colleges from the listing cards to compare them.</div> : <CompareTable colleges={colleges} />}
    </div>
  );
}
