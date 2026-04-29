import { PrismaClient } from "@prisma/client";

const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const commonOptions = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };

  if (isPostgres) {
    // PostgreSQL (production Docker) — gunakan adapter pg
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    // @ts-expect-error - Prisma client options expects specific adapter type
    return new PrismaClient({ adapter, ...commonOptions });
  }

  // SQLite (lokal dev) — gunakan adapter better-sqlite3
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const dbPath = (process.env.DATABASE_URL || "file:./dev.db").replace("file:", "");
  const adapter = new PrismaBetterSqlite3(dbPath);
  // @ts-expect-error - Prisma client options expects specific adapter type
  return new PrismaClient({ adapter, ...commonOptions });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
