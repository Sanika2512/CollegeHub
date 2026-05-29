import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const [colleges, users, reviews, questions, answers, saved, comparisons, recentUsers, recentColleges, pendingReviews] =
    await Promise.all([
      prisma.college.count(),
      prisma.user.count(),
      prisma.review.count(),
      prisma.question.count(),
      prisma.answer.count(),
      prisma.savedCollege.count(),
      prisma.savedComparison.count(),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, email: true, createdAt: true } }),
      prisma.college.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, city: true, state: true, rating: true, image: true, createdAt: true }
      }),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          rating: true,
          title: true,
          createdAt: true,
          college: { select: { name: true } },
          user: { select: { name: true, email: true } }
        }
      })
    ]);

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    stats: { colleges, users, reviews, questions, answers, saved, comparisons },
    recentUsers: recentUsers.map((user) => ({
      ...user,
      isAdmin: Boolean(adminEmail && user.email.toLowerCase() === adminEmail)
    })),
    recentColleges,
    pendingReviews
  });
}
