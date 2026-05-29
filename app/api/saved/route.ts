import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ collegeId: z.string().min(1) });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const saved = await prisma.savedCollege.findMany({
    where: { userId: session.user.id },
    include: { college: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(saved, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = schema.parse(await request.json());
  const saved = await prisma.savedCollege.upsert({
    where: { userId_collegeId: { userId: session.user.id, collegeId: body.collegeId } },
    update: {},
    create: { userId: session.user.id, collegeId: body.collegeId }
  });
  return NextResponse.json(saved, { status: 201 });
}
