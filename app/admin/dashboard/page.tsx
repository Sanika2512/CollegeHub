import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PageLayout } from "@/components/layout/PageLayout";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/admin/dashboard");
  if (session.user.role !== "ADMIN") redirect("/dashboard/saved");

  return (
    <PageLayout>
      <AdminDashboardClient adminName={session.user.name ?? session.user.email ?? "Admin"} adminUserId={session.user.id} />
    </PageLayout>
  );
}
