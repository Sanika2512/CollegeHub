import { PageLayout } from "@/components/layout/PageLayout";
import { DiscussionClient } from "@/components/discussions/DiscussionClient";

export const dynamic = "force-dynamic";

export default function DiscussionsPage() {
  return (
    <PageLayout>
      <DiscussionClient />
    </PageLayout>
  );
}
