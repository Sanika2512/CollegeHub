import { Star } from "lucide-react";

export function StarRating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={star <= Math.round(value) ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4 text-slate-300"} />
      ))}
      <span className="ml-1 font-semibold text-slate-700">{value.toFixed(1)}</span>
      {typeof count === "number" ? <span className="text-slate-500">({count})</span> : null}
    </div>
  );
}
