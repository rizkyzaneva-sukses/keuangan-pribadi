import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { TemplateForm } from "./TemplateForm";

export default async function TemplatesPage() {
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const templates = await db.templateAlokasi.findMany({
    where: { userId },
    include: { pos: { orderBy: { urutan: "asc" } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return (
    <AppShell user={user || { email }} active="/templates">
      <div className="page-header mb-1">
        <h2>Template Alokasi</h2>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>Kelola template alokasi profit dan pos-posnya.</p>

      <TemplateForm />

      <div className="mt-6 space-y-4">
        {templates.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }} className="text-[0.8rem]">Belum ada template.</p>
        ) : (
          templates.map((t) => {
            const totalPersen = t.pos.reduce((s, p) => s + p.persentase, 0);
            return (
              <div key={t.id} className="card">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-[0.85rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {t.nama}{" "}
                      {t.isDefault && (
                        <span className="badge-green ml-1.5">DEFAULT</span>
                      )}
                    </h3>
                    {t.catatan && <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>{t.catatan}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-[0.65rem] uppercase font-semibold" style={{ color: "var(--text-muted)" }}>Total</div>
                    <div
                      className={`text-[0.95rem] font-bold`}
                      style={{ color: totalPersen === 100 ? "var(--accent-green)" : "var(--accent-gold)" }}
                    >
                      {totalPersen}%
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden rounded-md border border-[var(--bg-border)]">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Urutan</th>
                        <th>Nama Pos</th>
                        <th className="text-right">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {t.pos.map((p) => (
                        <tr key={p.id}>
                          <td style={{ color: "var(--text-muted)" }}>{p.urutan}</td>
                          <td style={{ color: "var(--text-primary)" }}>{p.nama}</td>
                          <td className="text-right font-medium" style={{ color: "var(--text-primary)" }}>{p.persentase}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
