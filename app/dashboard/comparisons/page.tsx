import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { GitCompare } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/layout/PageLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ComparisonsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/dashboard/comparisons");
  const comparisons = await prisma.savedComparison.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } });

  return (
    <PageLayout>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Sidebar />
        <section>
          <p className="text-sm font-semibold uppercase text-primary">Dashboard</p>
          <h1 className="font-display text-3xl font-black sm:text-4xl">Saved comparisons</h1>
          <div className="mt-6 space-y-3">
            {comparisons.length === 0 ? (
              <Card className="p-8 text-center text-slate-600">Saved comparisons will appear here.</Card>
            ) : (
              comparisons.map((comparison) => (
                <Card key={comparison.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold"><GitCompare className="h-4 w-4 text-primary" /> {comparison.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{comparison.createdAt.toLocaleDateString("en-IN")}</p>
                  </div>
                  <Link href={`/compare?ids=${comparison.collegeIds.join(",")}`}><Button variant="outline" className="w-full sm:w-auto">Open</Button></Link>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
