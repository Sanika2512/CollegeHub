import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const state = searchParams.get("state")?.trim();
  const type = searchParams.get("type")?.trim();
  const stream = searchParams.get("stream")?.trim();
  const maxFee = Number(searchParams.get("maxFee") || 0);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const take = 12;

  const where: Prisma.CollegeWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
            { state: { contains: q, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(state ? { state } : {}),
    ...(type ? { type } : {}),
    ...(stream ? { stream: { has: stream } } : {}),
    ...(maxFee ? { fees: { lte: maxFee } } : {})
  };

  const session = await getServerSession(authOptions);
  const [items, total, saved] = await Promise.all([
    prisma.college.findMany({
      where,
      orderBy: [{ rating: "desc" }, { name: "asc" }],
      skip: (page - 1) * take,
      take
    }),
    prisma.college.count({ where }),
    session?.user?.id
      ? prisma.savedCollege.findMany({ where: { userId: session.user.id }, select: { collegeId: true } })
      : Promise.resolve([])
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageCount: Math.ceil(total / take),
    savedIds: saved.map((item) => item.collegeId)
  });
}
