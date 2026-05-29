import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { questionId: string } }) {
  await prisma.question.update({ where: { id: params.questionId }, data: { views: { increment: 1 } } }).catch(() => null);
  const answers = await prisma.answer.findMany({
    where: { questionId: params.questionId },
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
    include: { author: { select: { name: true, image: true } }, _count: { select: { votes: true } } }
  });
  return NextResponse.json({ items: answers });
}

export async function POST(request: Request, { params }: { params: { questionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { body } = await request.json();
  const content = String(body ?? "").trim();
  if (content.length < 12) return NextResponse.json({ error: "Answer needs a little more detail" }, { status: 400 });

  const question = await prisma.question.findUnique({ where: { id: params.questionId }, select: { id: true, title: true, authorId: true, slug: true } });
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const duplicate = await prisma.answer.findFirst({
    where: {
      questionId: params.questionId,
      authorId: session.user.id,
      body: content,
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
    }
  });
  if (duplicate) return NextResponse.json({ error: "This answer was already submitted" }, { status: 409 });

  const answer = await prisma.answer.create({
    data: { body: content, questionId: params.questionId, authorId: session.user.id },
    include: { author: { select: { name: true, image: true } }, _count: { select: { votes: true } } }
  });
  if (question.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: question.authorId,
        type: "answer",
        title: "New answer on your question",
        body: question.title,
        href: `/discussions?question=${question.id}`
      }
    });
  }
  return NextResponse.json(answer, { status: 201 });
}
