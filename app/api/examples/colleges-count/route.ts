import { NextResponse } from "next/server";
import { getDatabaseErrorMessage } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.college.count();
    return NextResponse.json({
      ok: true,
      source: "postgresql",
      collegeCount: count
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "postgresql",
        error: getDatabaseErrorMessage(error)
      },
      { status: 503 }
    );
  }
}
