"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const states = ["Delhi", "Karnataka", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal"];
const streams = ["engineering", "medical", "arts", "commerce", "science", "management", "law", "architecture", "pharmacy"];

export function CollegeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams?.toString() ?? "";
  const [q, setQ] = useState(searchParams?.get("q") ?? "");

  const current = useMemo(() => new URLSearchParams(paramsString), [paramsString]);
  function update(key: string, value: string) {
    const params = new URLSearchParams(paramsString);
    value ? params.set(key, value) : params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => update("q", q), 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search by college, city, or state" className="pl-10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={current.get("state") ?? ""} onChange={(event) => update("state", event.target.value)}>
          <option value="">All states</option>
          {states.map((state) => <option key={state}>{state}</option>)}
        </Select>
        <Select value={current.get("type") ?? ""} onChange={(event) => update("type", event.target.value)}>
          <option value="">All types</option>
          <option value="government">Government</option>
          <option value="private">Private</option>
          <option value="deemed">Deemed</option>
        </Select>
        <Select value={current.get("stream") ?? ""} onChange={(event) => update("stream", event.target.value)}>
          <option value="">All streams</option>
          {streams.map((stream) => <option key={stream} value={stream}>{stream}</option>)}
        </Select>
        <Select value={current.get("maxFee") ?? ""} onChange={(event) => update("maxFee", event.target.value)}>
          <option value="">Any fee</option>
          <option value="50000">Under Rs 50K</option>
          <option value="150000">Under Rs 1.5L</option>
          <option value="300000">Under Rs 3L</option>
          <option value="600000">Under Rs 6L</option>
        </Select>
      </div>
    </div>
  );
}
