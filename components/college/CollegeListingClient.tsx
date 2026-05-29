"use client";

import type { College } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { CollegeGrid } from "@/components/college/CollegeGrid";

type ListingResponse = {
  items: College[];
  total: number;
  page: number;
  pageCount: number;
  savedIds: string[];
};

export function CollegeListingClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams?.toString() ?? "";
  const [data, setData] = useState<ListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = useMemo(() => `/api/colleges${paramsString ? `?${paramsString}` : ""}`, [paramsString]);

  function goToPage(page: number) {
    const params = new URLSearchParams(paramsString);
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const loadColleges = useCallback(async (showError = false) => {
    try {
      const response = await fetch(apiUrl, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load colleges");
      setData(payload);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load colleges";
      setError(message);
      if (showError) toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    setLoading(true);
    loadColleges(true);
    const intervalId = window.setInterval(() => loadColleges(), 5000);
    return () => window.clearInterval(intervalId);
  }, [loadColleges]);

  if (error && !data) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center">
        <h2 className="font-display text-2xl font-black">Could not load colleges</h2>
        <Button className="mt-4" onClick={() => loadColleges(true)}>Try again</Button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6">
        {loading && !data ? (
          <div className="h-72 animate-pulse rounded-lg bg-slate-200" />
        ) : (
          <CollegeGrid colleges={data?.items ?? []} savedIds={data?.savedIds ?? []} />
        )}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Page {data?.page ?? Number(searchParams?.get("page") ?? 1)} of {data?.pageCount ?? 1} - {data?.total ?? 0} results
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button variant="outline" className="w-full sm:w-auto" disabled={(data?.page ?? 1) <= 1} onClick={() => goToPage((data?.page ?? 1) - 1)}>Previous</Button>
          <Button variant="outline" className="w-full sm:w-auto" disabled={(data?.page ?? 1) >= (data?.pageCount ?? 1)} onClick={() => goToPage((data?.page ?? 1) + 1)}>Next</Button>
        </div>
      </div>
    </>
  );
}
