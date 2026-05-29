import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageLayout } from "@/components/layout/PageLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { SavedCollegesClient } from "@/components/dashboard/SavedCollegesClient";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/saved");
  return (
    <PageLayout>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Sidebar />
        <section>
          <p className="text-sm font-semibold uppercase text-primary">Dashboard</p>
          <h1 className="font-display text-3xl font-black sm:text-4xl">Saved colleges</h1>
          <div className="mt-6">
            <SavedCollegesClient />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
