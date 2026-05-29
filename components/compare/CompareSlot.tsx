import type { College } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";

export function CompareSlot({ college }: { college?: College }) {
  if (!college) {
    return <Card className="flex min-h-32 items-center justify-center border-dashed p-5 text-center text-sm text-slate-500">Add another college from listings</Card>;
  }
  return (
    <Card className="p-5">
      <p className="font-display text-lg font-black">{college.name}</p>
      <p className="mt-1 text-sm text-slate-500">{college.location}</p>
      <div className="mt-3"><StarRating value={college.rating} /></div>
    </Card>
  );
}
