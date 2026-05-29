import { PageLayout } from "@/components/layout/PageLayout";
import { PredictorClient } from "@/components/predictor/PredictorClient";

export const dynamic = "force-dynamic";

export default function PredictorPage() {
  return (
    <PageLayout>
      <PredictorClient />
    </PageLayout>
  );
}
