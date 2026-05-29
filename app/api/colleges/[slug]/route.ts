import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const college = await prisma.college.findUnique({
    where: { slug: params.slug },
    include: {
      courses: true,
      tourImages: { orderBy: { createdAt: "asc" } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" }
      },
      savedBy: { where: { userId: session?.user?.id ?? "__anonymous__" } }
    }
  });

  if (!college) return NextResponse.json({ error: "College not found" }, { status: 404 });
  return NextResponse.json({ ...college, isSaved: college.savedBy.length > 0 });
}
