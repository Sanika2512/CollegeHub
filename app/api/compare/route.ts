import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseIds } from "@/lib/utils";

export async function GET(request: Request) {
  const ids = parseIds(new URL(request.url).searchParams.get("ids"));
  if (ids.length < 2) return NextResponse.json({ error: "Choose at least two colleges" }, { status: 400 });
  const colleges = await prisma.college.findMany({
    where: { id: { in: ids } },
    include: { courses: true }
  });
  const ordered = ids.map((id) => colleges.find((college) => college.id === id)).filter(Boolean);
  return NextResponse.json(ordered);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { ids } = await request.json();
  const collegeIds = parseIds(Array.isArray(ids) ? ids.join(",") : String(ids ?? ""));
  if (collegeIds.length < 2) return NextResponse.json({ error: "Choose at least two colleges" }, { status: 400 });
  const colleges = await prisma.college.findMany({ where: { id: { in: collegeIds } }, select: { name: true } });
  const comparison = await prisma.savedComparison.create({
    data: { userId: session.user.id, collegeIds, title: colleges.map((college) => college.name).join(" vs ") }
  });
  return NextResponse.json(comparison, { status: 201 });
}
