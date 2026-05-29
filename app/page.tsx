import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { CollegeGrid } from "@/components/college/CollegeGrid";
import { PredictorWidget } from "@/components/college/PredictorWidget";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { RecentlyViewed } from "@/components/college/RecentlyViewed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, total] = await Promise.all([
    prisma.college.findMany({ orderBy: { rating: "desc" }, take: 6 }),
    prisma.college.count()
  ]);

  return (
    <PageLayout>
      <section className="grid items-center gap-8 py-6 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            <Sparkles className="h-4 w-4" /> Premium college discovery for India
          </div>
          <h1 className="font-display text-4xl font-black tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">Find the right college with clearer data.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Search across fees, placements, ratings, streams, reviews, and compare 2-3 colleges side by side before you shortlist.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/colleges"><Button>Explore colleges <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/compare"><Button variant="outline">Open compare</Button></Link>
          </div>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3 sm:gap-4">
            <Stat label="Colleges" value={<AnimatedCounter value={total} />} />
            <Stat label="Students helped" value={<AnimatedCounter value={125000} suffix="+" />} />
            <Stat label="Avg rating" value="4.3" />
          </div>
        </div>
        <PredictorWidget />
      </section>
      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Featured</p>
            <h2 className="font-display text-2xl font-black sm:text-3xl">Top colleges this week</h2>
          </div>
          <Link href="/colleges" className="text-sm font-semibold text-primary">View all</Link>
        </div>
        <CollegeGrid colleges={featured} />
      </section>
      <RecentlyViewed />
    </PageLayout>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="font-display text-2xl font-black">{value}</p></div>;
}
