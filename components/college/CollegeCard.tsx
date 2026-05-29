import Link from "next/link";
import type { College } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { SaveButton } from "@/components/college/SaveButton";
import { CompareButton } from "@/components/college/CompareButton";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc } from "@/lib/image-utils";
import { formatFees } from "@/lib/utils";

export function CollegeCard({ college, isSaved = false }: { college: College; isSaved?: boolean }) {
  const imageSrc = college.image?.includes("photo-1523050854058") ? "/college-placeholder.svg" : normalizeImageSrc(college.image);

  return (
    <Card className="lift overflow-hidden">
      <Link href={`/colleges/${college.slug}`} className="block">
        <div className="relative aspect-[16/9] bg-slate-100">
          <SafeImage src={imageSrc} alt={college.name} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 font-display text-lg font-black">{college.name}</h3>
              <p className="text-sm text-slate-500">{college.location}</p>
            </div>
            <Badge className="capitalize">{college.type}</Badge>
          </div>
          {college.nirfRank ? (
            <div className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              NIRF #{college.nirfRank} {college.nirfScore ? `- ${college.nirfScore}` : ""}
            </div>
          ) : null}
          <StarRating value={college.rating} count={college.reviewCount} />
          <div className="flex flex-wrap gap-2">
            {college.stream.slice(0, 3).map((stream) => (
              <span key={stream} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">{stream}</span>
            ))}
          </div>
          <p className="font-semibold text-slate-900">{formatFees(college.fees)}</p>
        </div>
      </Link>
      <div className="grid grid-cols-2 gap-2 border-t p-4">
        <SaveButton collegeId={college.id} initialSaved={isSaved} />
        <CompareButton collegeId={college.id} />
      </div>
    </Card>
  );
}
