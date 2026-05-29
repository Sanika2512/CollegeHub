import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, { params }: { params: { answerId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const existing = await prisma.answerVote.findUnique({
    where: { answerId_userId: { answerId: params.answerId, userId: session.user.id } }
  });

  if (existing) {
    await prisma.answerVote.delete({ where: { id: existing.id } });
  } else {
    await prisma.answerVote.create({ data: { answerId: params.answerId, userId: session.user.id } });
  }

  const votes = await prisma.answerVote.count({ where: { answerId: params.answerId } });
  return NextResponse.json({ voted: !existing, votes });
}
