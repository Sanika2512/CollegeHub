import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function assertDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      message: getDatabaseErrorMessage(error)
    };
  }
}

export function getDatabaseErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database connection failed. Check DATABASE_URL, PostgreSQL service status, credentials, and database name.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `Database request failed with Prisma code ${error.code}.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected database error.";
}
