import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <PageLayout><Skeleton className="h-12 w-64" /><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div></PageLayout>;
}
