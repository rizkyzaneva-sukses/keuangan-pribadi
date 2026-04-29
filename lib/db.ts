import { PrismaClient } from "@prisma/client";

const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adapterInstance: any = undefined;

if (!isPostgres) {
  // SQLite (lokal dev) — lazy import agar tidak crash di Docker saat PostgreSQL
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  adapterInstance = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./dev.db",
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(adapterInstance ? { adapter: adapterInstance } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
