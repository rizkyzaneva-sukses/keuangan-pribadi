export function insensitiveFilter() {
  const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
  return isPostgres ? { mode: "insensitive" as const } : {};
}
