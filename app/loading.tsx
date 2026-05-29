import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <PageLayout><Skeleton className="h-72 w-full" /><Skeleton className="mt-6 h-56 w-full" /></PageLayout>;
}
