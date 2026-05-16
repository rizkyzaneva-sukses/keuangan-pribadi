import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { LegacyImportClient } from "./LegacyImportClient";

export default async function ImportLamaPage() {
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true, email: true },
  });

  const [archiveCount, importedCount, recentArchive] = await Promise.all([
    db.legacyImportItem.count({
      where: { userId, targetType: "ARCHIVE_ONLY" },
    }),
    db.legacyImportItem.count({
      where: { userId },
    }),
    db.legacyImportItem.findMany({
      where: { userId, targetType: "ARCHIVE_ONLY" },
      orderBy: [{ importedAt: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        section: true,
        title: true,
        subtitle: true,
        importedAt: true,
      },
    }),
  ]);

  return (
    <AppShell user={user || { email }} active="/import-lama">
      <div className="page-header mb-5">
        <h2>Import App Lama</h2>
        <p>
          Upload backup JSON dari app lama, review mapping investasi, lalu import
          ke schema app baru ini dengan arsip migrasi untuk data yang belum punya
          modul khusus.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="stat-card">
          <div className="stat-label">Total Legacy Items</div>
          <div className="stat-value" style={{ color: "var(--accent-blue)" }}>
            {importedCount}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Arsip Migrasi</div>
          <div className="stat-value" style={{ color: "var(--accent-gold)" }}>
            {archiveCount}
          </div>
        </div>
      </div>

      <LegacyImportClient />

      {recentArchive.length > 0 && (
        <section className="mt-6 card">
          <div className="section-title">Arsip Terbaru</div>
          <div className="space-y-2">
            {recentArchive.map((item) => (
              <div
                key={item.id}
                className="rounded-md border px-3 py-2.5"
                style={{ borderColor: "var(--bg-border)", backgroundColor: "var(--bg-elevated)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[0.82rem] font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.title || "Tanpa judul"}
                    </div>
                    <div className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                      {item.section}
                      {item.subtitle ? ` • ${item.subtitle}` : ""}
                    </div>
                  </div>
                  <div className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(item.importedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
