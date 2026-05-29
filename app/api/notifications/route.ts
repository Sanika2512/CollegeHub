import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ items: [], unread: 0 });
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } })
  ]);
  return NextResponse.json({ items, unread });
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  await prisma.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
