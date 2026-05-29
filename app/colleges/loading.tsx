import { PageLayout } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <PageLayout>
      <Skeleton className="h-12 w-60" />
      <Skeleton className="mt-6 h-36 w-full" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-96 w-full" />)}
      </div>
    </PageLayout>
  );
}
