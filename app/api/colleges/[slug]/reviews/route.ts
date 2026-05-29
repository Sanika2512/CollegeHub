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

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const college = await prisma.college.findUnique({
    where: { slug: params.slug },
    select: {
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!college) return NextResponse.json({ error: "College not found" }, { status: 404 });
  return NextResponse.json(college.reviews);
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const body = schema.parse(await request.json());
    const college = await prisma.college.findUnique({ where: { slug: params.slug } });
    if (!college) return NextResponse.json({ error: "College not found" }, { status: 404 });
    const review = await prisma.review.create({
      data: { ...body, userId: session.user.id, collegeId: college.id },
      include: { user: { select: { name: true, image: true } } }
    });
    const aggregate = await prisma.review.aggregate({ where: { collegeId: college.id }, _avg: { rating: true }, _count: true });
    await prisma.college.update({
      where: { id: college.id },
      data: { rating: Number((aggregate._avg.rating ?? college.rating).toFixed(1)), reviewCount: aggregate._count }
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid review request" }, { status: 400 });
  }
}
