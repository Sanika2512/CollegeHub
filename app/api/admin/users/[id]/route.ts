import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  if (params.id === admin.session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { email: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (adminEmail && user.email.toLowerCase() === adminEmail) {
    return NextResponse.json({ error: "Admin account cannot be deleted" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { userId: params.id } }),
    prisma.answerVote.deleteMany({ where: { userId: params.id } }),
    prisma.savedCollege.deleteMany({ where: { userId: params.id } }),
    prisma.savedComparison.deleteMany({ where: { userId: params.id } }),
    prisma.review.deleteMany({ where: { userId: params.id } }),
    prisma.answer.deleteMany({ where: { authorId: params.id } }),
    prisma.question.deleteMany({ where: { authorId: params.id } }),
    prisma.user.delete({ where: { id: params.id } })
  ]);

  return NextResponse.json({ ok: true });
}
