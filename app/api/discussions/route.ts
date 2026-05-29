import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const take = 8;

function serializeQuestion(question: any) {
  return {
    id: question.id,
    title: question.title,
    body: question.body,
    slug: question.slug,
    category: question.category,
    views: question.views,
    createdAt: question.createdAt,
    author: question.author,
    tags: question.questionTags.map((item: any) => item.tag),
    answersCount: question._count.answers,
    votesCount: question.answers.reduce((sum: number, answer: any) => sum + answer._count.votes, 0),
    latestAnswer: question.answers[0] ?? null
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const tag = searchParams.get("tag")?.trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));

  const where: Prisma.QuestionWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
            { questionTags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } }
          ]
        }
      : {}),
    ...(category ? { category } : {}),
    ...(tag ? { questionTags: { some: { tag: { slug: tag } } } } : {})
  };

  const [questions, total, tags, trending, mostAnswered] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: {
        author: { select: { name: true, image: true } },
        questionTags: { include: { tag: true } },
        answers: { orderBy: { createdAt: "desc" }, take: 1, include: { author: { select: { name: true, image: true } }, _count: { select: { votes: true } } } },
        _count: { select: { answers: true } }
      }
    }),
    prisma.question.count({ where }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findMany({ orderBy: [{ views: "desc" }, { createdAt: "desc" }], take: 5, select: { id: true, title: true, slug: true, views: true } }),
    prisma.question.findMany({ orderBy: [{ answers: { _count: "desc" } }, { createdAt: "desc" }], take: 5, select: { id: true, title: true, slug: true, _count: { select: { answers: true } } } })
  ]);

  return NextResponse.json({
    items: questions.map(serializeQuestion),
    total,
    page,
    pageCount: Math.ceil(total / take),
    tags,
    trending,
    mostAnswered
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const content = String(body.body ?? "").trim();
  const category = String(body.category ?? "Admissions").trim();
  const rawTags = Array.isArray(body.tags) ? body.tags : [];
  const tagNames = rawTags.map((tag: unknown) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 5);

  if (title.length < 12 || content.length < 20) {
    return NextResponse.json({ error: "Add a clear title and enough context" }, { status: 400 });
  }

  const duplicate = await prisma.question.findFirst({
    where: {
      authorId: session.user.id,
      title: { equals: title, mode: "insensitive" },
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }
    }
  });
  if (duplicate) return NextResponse.json({ error: "This question was already submitted" }, { status: 409 });

  const tags = await Promise.all(
    tagNames.map((name: string) =>
      prisma.tag.upsert({ where: { slug: slugify(name) }, update: { name }, create: { name, slug: slugify(name) } })
    )
  );
  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const question = await prisma.question.create({
    data: {
      title,
      body: content,
      category,
      slug,
      authorId: session.user.id,
      questionTags: { create: tags.map((tag) => ({ tagId: tag.id })) }
    }
  });

  return NextResponse.json(question, { status: 201 });
}
