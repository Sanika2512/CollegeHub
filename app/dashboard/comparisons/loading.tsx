import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <PageLayout><Skeleton className="h-12 w-80" /><Skeleton className="mt-6 h-40 w-full" /></PageLayout>;
}
