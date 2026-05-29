import type { College } from "@prisma/client";
import { CollegeCard } from "@/components/college/CollegeCard";

export function CollegeGrid({ colleges, savedIds = [] }: { colleges: College[]; savedIds?: string[] }) {
  if (colleges.length === 0) {
    return <div className="rounded-lg border bg-white p-10 text-center text-slate-600">No colleges match these filters.</div>;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {colleges.map((college) => (
        <CollegeCard key={college.id} college={college} isSaved={savedIds.includes(college.id)} />
      ))}
    </div>
  );
}
