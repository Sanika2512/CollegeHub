import { PageLayout } from "@/components/layout/PageLayout";
import { ComparePageClient } from "@/components/compare/ComparePageClient";
import { parseIds } from "@/lib/utils";

export default function ComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  return (
    <PageLayout>
      <ComparePageClient initialIds={parseIds(searchParams.ids)} />
    </PageLayout>
  );
}
