import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function assertNeonConnectionString() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the PostgreSQL connection.");
  }

  const url = new URL(databaseUrl);
  if (url.hostname.includes("neon.tech") && url.searchParams.get("sslmode") !== "require") {
    throw new Error("Neon PostgreSQL requires DATABASE_URL to include sslmode=require.");
  }
}

assertNeonConnectionString();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
