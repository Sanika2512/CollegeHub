import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <PageLayout><Skeleton className="h-72 w-full" /><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]"><Skeleton className="h-96" /><Skeleton className="h-64" /></div></PageLayout>;
}
