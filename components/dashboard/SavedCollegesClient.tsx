"use client";

import type { College, SavedCollege } from "@prisma/client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CollegeGrid } from "@/components/college/CollegeGrid";
import { Skeleton } from "@/components/ui/Skeleton";

type SavedWithCollege = SavedCollege & { college: College };

const cacheKey = "collegehub:saved-colleges";

export function SavedCollegesClient() {
  const [saved, setSaved] = useState<SavedWithCollege[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setSaved(JSON.parse(cached));
      setLoading(false);
    }

    async function loadSaved(showError = false) {
      try {
        const response = await fetch("/api/saved", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load saved colleges");
        if (!active) return;
        setSaved(payload);
        localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch (error) {
        if (showError) toast.error(error instanceof Error ? error.message : "Could not load saved colleges");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSaved(true);
    const intervalId = window.setInterval(() => loadSaved(), 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <Skeleton key={item} className="h-96" />)}
      </div>
    );
  }

  return <CollegeGrid colleges={saved.map((item) => item.college)} savedIds={saved.map((item) => item.collegeId)} />;
}
