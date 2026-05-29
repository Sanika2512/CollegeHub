"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Filter, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc } from "@/lib/image-utils";
import { formatFees, formatPackage } from "@/lib/utils";

type Prediction = {
  id: string;
  cutoffRank: number;
  category: string;
  branch: string;
  year: number;
  chance: "Safe" | "Moderate" | "Dream";
  confidence: number;
  rankGap: number;
  advice: string;
  matchNotes: string[];
  college: {
    name: string;
    slug: string;
    location: string;
    fees: number;
    rating: number;
    type: string;
    avgPackage: number;
    highPackage: number;
    image: string | null;
  };
};

type PredictorResponse = {
  items: Prediction[];
  relaxedBranch?: boolean;
  relaxedCategory?: boolean;
  relaxedState?: boolean;
  summary?: { total: number; safe: number; moderate: number; dream: number };
};

const chanceStyles = {
  Safe: "bg-emerald-50 text-emerald-700",
  Moderate: "bg-amber-50 text-amber-700",
  Dream: "bg-rose-50 text-rose-700"
};

export function PredictorClient() {
  const [exam, setExam] = useState("JEE Main");
  const [rank, setRank] = useState("12000");
  const [category, setCategory] = useState("General");
  const [state, setState] = useState("");
  const [branch, setBranch] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [chance, setChance] = useState("");
  const [sortBy, setSortBy] = useState("confidence");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Prediction[]>([]);
  const [matchNote, setMatchNote] = useState("");
  const [searched, setSearched] = useState(false);

  const countByChance = useMemo(
    () => ({
      Safe: items.filter((item) => item.chance === "Safe").length,
      Moderate: items.filter((item) => item.chance === "Moderate").length,
      Dream: items.filter((item) => item.chance === "Dream").length
    }),
    [items]
  );

  const runPrediction = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const params = new URLSearchParams({ exam, rank });
    if (category) params.set("category", category);
    if (state) params.set("state", state);
    if (branch) params.set("branch", branch);
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (maxFee) params.set("maxFee", maxFee);
    if (chance) params.set("chance", chance);
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(`/api/predictor?${params.toString()}`);
      const data = (await response.json()) as PredictorResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Prediction failed");
      setItems(data.items);
      const relaxed = [
        data.relaxedBranch ? "nearest branch" : "",
        data.relaxedCategory ? "all categories" : "",
        data.relaxedState ? "all states" : ""
      ].filter(Boolean);
      setMatchNote(relaxed.length ? `No exact match found, showing ${relaxed.join(", ")}.` : "");
      if (data.items.length && relaxed.length) toast("Showing expanded matches");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run predictor");
    } finally {
      setLoading(false);
    }
  }, [branch, category, chance, exam, maxFee, q, rank, state, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searched && rank) {
        void runPrediction();
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [chance, maxFee, q, rank, runPrediction, searched, sortBy, type]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortBy === "fees") return a.college.fees - b.college.fees;
      if (sortBy === "rating") return b.college.rating - a.college.rating;
      if (sortBy === "package") return b.college.avgPackage - a.college.avgPackage;
      if (sortBy === "cutoff") return Math.abs(a.rankGap) - Math.abs(b.rankGap);
      return b.confidence - a.confidence;
    });
  }, [items, sortBy]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Predictor</p>
            <h1 className="font-display text-3xl font-black sm:text-4xl">Find colleges by rank</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Match exam rank, category, state, and branch against Neon cutoff data. Short forms like CSE, CS, ECE, MBA also work.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold sm:min-w-64">
            {(["Safe", "Moderate", "Dream"] as const).map((chance) => (
              <div key={chance} className="rounded-md border px-3 py-2">
                <p className="text-lg font-black">{countByChance[chance]}</p>
                <p className="text-slate-500">{chance}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={runPrediction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select value={exam} onChange={(event) => setExam(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/20">
            <option>JEE Main</option>
            <option>JEE Advanced</option>
            <option>CUET</option>
            <option>CAT</option>
          </select>
          <Input value={rank} onChange={(event) => setRank(event.target.value)} type="number" min="1" placeholder="Rank" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/20">
            <option>General</option>
            <option>OBC</option>
            <option>SC</option>
            <option>ST</option>
            <option>EWS</option>
          </select>
          <Input value={state} onChange={(event) => setState(event.target.value)} placeholder="State optional" />
          <Input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="Branch optional" />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Predict
          </Button>
        </form>
      </section>

      <div className="rounded-lg border bg-white p-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search predicted colleges, cities, states" className="border-0 px-0 focus:ring-0" />
          <Filter className="h-4 w-4 text-slate-400" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={chance} onChange={(event) => setChance(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/20">
            <option value="">All chances</option>
            <option value="Safe">Safe only</option>
            <option value="Moderate">Moderate only</option>
            <option value="Dream">Dream only</option>
          </select>
          <select value={type} onChange={(event) => setType(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm capitalize outline-none focus:ring-4 focus:ring-primary/20">
            <option value="">All college types</option>
            <option value="government">Government</option>
            <option value="private">Private</option>
            <option value="deemed">Deemed</option>
          </select>
          <Input value={maxFee} onChange={(event) => setMaxFee(event.target.value)} type="number" min="1" placeholder="Max annual fee" />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 rounded-md border bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-primary/20">
            <option value="confidence">Sort by confidence</option>
            <option value="cutoff">Closest cutoff</option>
            <option value="fees">Lowest fees</option>
            <option value="rating">Highest rating</option>
            <option value="package">Best package</option>
          </select>
        </div>
        {matchNote ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
            <SlidersHorizontal className="h-4 w-4" />
            {matchNote}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-lg bg-slate-200" />)}
        </div>
      ) : sortedItems.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedItems.map((item) => (
            <Link key={item.id} href={`/colleges/${item.college.slug}`} className="lift rounded-lg border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <SafeImage src={normalizeImageSrc(item.college.image)} alt={item.college.name} className="h-40 w-full rounded-md object-cover sm:h-20 sm:w-28" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-black">{item.college.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {item.college.location}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">{item.confidence}% confidence</p>
                </div>
                <Badge className={chanceStyles[item.chance]}>{item.chance}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <Metric label="Cutoff" value={item.cutoffRank.toLocaleString("en-IN")} />
                <Metric label="Gap" value={item.rankGap >= 0 ? `+${item.rankGap.toLocaleString("en-IN")}` : item.rankGap.toLocaleString("en-IN")} />
                <Metric label="Fees" value={formatFees(item.college.fees)} />
                <Metric label="Avg pkg" value={formatPackage(item.college.avgPackage)} />
                <Metric label="Rating" value={item.college.rating.toFixed(1)} />
                <Metric label="Branch" value={item.branch} />
              </div>
              <p className="mt-3 text-sm text-slate-600">{item.advice}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.matchNotes.map((note) => (
                  <span key={note} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{note}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-10 text-center text-slate-600">
          {searched ? "No colleges match this rank and filter combination." : "Enter your exam and rank to see safe, moderate, and dream options."}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-slate-900">{value}</p>
    </div>
  );
}
