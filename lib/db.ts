import { PrismaClient } from "@prisma/client";

const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  if (isPostgres) {
    // PostgreSQL (production Docker) — gunakan koneksi standar tanpa adapter
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // SQLite (lokal dev) — gunakan adapter better-sqlite3
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const dbPath = (process.env.DATABASE_URL || "file:./dev.db").replace("file:", "");
  const adapter = new PrismaBetterSqlite3(dbPath);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
