"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const matches = [
  { max: 500, name: "IIT Bombay", slug: "iit-bombay" },
  { max: 900, name: "IIT Delhi", slug: "iit-delhi" },
  { max: 3000, name: "NIT Trichy", slug: "nit-trichy" },
  { max: 8000, name: "BITS Pilani", slug: "bits-pilani" },
  { max: 18000, name: "COEP Pune", slug: "coep-pune" },
  { max: 35000, name: "VIT Vellore", slug: "vit-vellore" },
  { max: 70000, name: "SRM Institute", slug: "srm-institute" }
];

export function PredictorWidget() {
  const [rank, setRank] = useState("");
  const college = useMemo(() => matches.find((item) => Number(rank) <= item.max), [rank]);
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="font-display text-2xl font-black">College Predictor</h2>
      <div className="mt-4 flex gap-2">
        <Input type="number" min="1" placeholder="Enter JEE rank" value={rank} onChange={(event) => setRank(event.target.value)} />
        {college ? (
          <Link href={`/colleges/${college.slug}`}>
            <Button>View match</Button>
          </Link>
        ) : (
          <Button disabled>Predict</Button>
        )}
      </div>
      {rank ? <p className="mt-3 text-sm text-slate-600">{college ? `Best seed-data match: ${college.name}` : "Try a rank under 70,000 for seed-data matches."}</p> : null}
    </div>
  );
}
