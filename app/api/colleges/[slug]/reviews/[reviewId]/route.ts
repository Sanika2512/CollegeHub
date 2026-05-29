import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(120),
  body: z.string().min(20).max(1000)
});

async function refreshCollegeRating(collegeId: string) {
  const aggregate = await prisma.review.aggregate({ where: { collegeId }, _avg: { rating: true }, _count: true });
  await prisma.college.update({
    where: { id: collegeId },
    data: {
      rating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
      reviewCount: aggregate._count
    }
  });
}

async function getOwnedReview(slug: string, reviewId: string, userId: string) {
  return prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
      college: { slug }
    },
    select: { id: true, collegeId: true }
  });
}

export async function PATCH(request: Request, { params }: { params: { slug: string; reviewId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const ownedReview = await getOwnedReview(params.slug, params.reviewId, session.user.id);
  if (!ownedReview) return NextResponse.json({ error: "Review not found or not yours" }, { status: 404 });

  try {
    const body = schema.parse(await request.json());
    const review = await prisma.review.update({
      where: { id: ownedReview.id },
      data: body,
      include: { user: { select: { name: true, image: true } } }
    });
    await refreshCollegeRating(ownedReview.collegeId);
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Invalid review request" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { slug: string; reviewId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const ownedReview = await getOwnedReview(params.slug, params.reviewId, session.user.id);
  if (!ownedReview) return NextResponse.json({ error: "Review not found or not yours" }, { status: 404 });

  await prisma.review.delete({ where: { id: ownedReview.id } });
  await refreshCollegeRating(ownedReview.collegeId);
  return NextResponse.json({ ok: true });
}
