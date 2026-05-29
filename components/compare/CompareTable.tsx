"use client";

import type { College } from "@prisma/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatFees, formatPackage, getAcceptanceRate } from "@/lib/utils";
import { useCompareStore } from "@/lib/compare-store";

type Row = {
  label: string;
  values: string[];
  scores: number[];
  higherBetter?: boolean;
};

export function CompareTable({ colleges }: { colleges: College[] }) {
  const { remove } = useCompareStore();
  const rows: Row[] = [
    { label: "Fees", values: colleges.map((c) => formatFees(c.fees)), scores: colleges.map((c) => c.fees), higherBetter: false },
    { label: "Rating", values: colleges.map((c) => c.rating.toFixed(1)), scores: colleges.map((c) => c.rating), higherBetter: true },
    { label: "NAAC grade", values: colleges.map((c) => c.naacGrade), scores: colleges.map((c) => gradeScore(c.naacGrade)), higherBetter: true },
    { label: "Avg placement", values: colleges.map((c) => formatPackage(c.avgPackage)), scores: colleges.map((c) => c.avgPackage), higherBetter: true },
    { label: "Highest placement", values: colleges.map((c) => formatPackage(c.highPackage)), scores: colleges.map((c) => c.highPackage), higherBetter: true },
    { label: "Location", values: colleges.map((c) => c.location), scores: colleges.map(() => 0), higherBetter: true },
    { label: "Type", values: colleges.map((c) => c.type), scores: colleges.map((c) => (c.type === "government" ? 3 : c.type === "deemed" ? 2 : 1)), higherBetter: true },
    { label: "Acceptance rate", values: colleges.map((c) => `${getAcceptanceRate(c.fees, c.rating, c.type)}%`), scores: colleges.map((c) => getAcceptanceRate(c.fees, c.rating, c.type)), higherBetter: false }
  ];

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="w-44 p-4 text-left font-semibold">Metric</th>
            {colleges.map((college) => (
              <th key={college.id} className="p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-lg font-black">{college.name}</span>
                  <Button variant="ghost" className="h-8 w-8 px-0" onClick={() => remove(college.id)} aria-label={`Remove ${college.name}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const best = row.higherBetter ? Math.max(...row.scores) : Math.min(...row.scores);
            return (
              <tr key={row.label} className="border-t">
                <td className="p-4 font-semibold text-slate-600">{row.label}</td>
                {row.values.map((value, index) => (
                  <td key={value + index} className={row.scores[index] === best && row.label !== "Location" ? "bg-emerald-50 p-4 font-semibold text-emerald-700" : "p-4 capitalize text-slate-800"}>
                    {value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function gradeScore(grade: string) {
  return { "A++": 5, "A+": 4, A: 3, B: 2 }[grade] ?? 1;
}
