import { PageLayout } from "@/components/layout/PageLayout";
import { CollegeFilters } from "@/components/college/CollegeFilters";
import { CollegeListingClient } from "@/components/college/CollegeListingClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CollegesPage() {
  return (
    <PageLayout>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase text-primary">Discover</p>
        <h1 className="font-display text-3xl font-black sm:text-4xl">Colleges</h1>
      </div>
      <CollegeFilters />
      <CollegeListingClient />
    </PageLayout>
  );
}
