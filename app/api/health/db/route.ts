import { NextResponse } from "next/server";
import { assertDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await assertDatabaseConnection();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        database: "postgresql",
        error: result.message
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    database: "postgresql",
    message: "PostgreSQL connection is healthy"
  });
}
