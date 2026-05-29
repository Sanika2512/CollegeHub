import type { College } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { StarRating } from "@/components/ui/StarRating";
import { normalizeImageSrc } from "@/lib/image-utils";
import { formatFees, formatPackage } from "@/lib/utils";

export function CollegeHero({ college }: { college: College }) {
  const imageSrc = college.image?.includes("photo-1523050854058") ? "/college-placeholder.svg" : normalizeImageSrc(college.image);

  return (
    <section className="overflow-hidden rounded-lg border bg-white">
      <div className="relative h-72 sm:h-80">
        <SafeImage src={imageSrc} alt={college.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="absolute bottom-0 p-4 text-white sm:p-6">
          <Badge className="mb-3 bg-white text-primary capitalize">{college.type}</Badge>
          <h1 className="font-display text-3xl font-black sm:text-4xl md:text-5xl">{college.name}</h1>
          <p className="mt-2 text-white/85">{college.location}</p>
          <div className="mt-3"><StarRating value={college.rating} count={college.reviewCount} /></div>
        </div>
      </div>
      <div className="grid gap-4 p-4 text-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <Stat label="Annual fees" value={formatFees(college.fees)} />
        <Stat label="NAAC grade" value={college.naacGrade} />
        <Stat label="Avg package" value={formatPackage(college.avgPackage)} />
        <Stat label="Established" value={String(college.established)} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-slate-500">{label}</p><p className="mt-1 break-words font-display text-xl font-black">{value}</p></div>;
}
