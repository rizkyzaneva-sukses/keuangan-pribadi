import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { TemanEditForm, TemanForm, DevidenEditForm, DevidenForm } from "./Forms";
import { BuktiField } from "@/components/Bukti";
import { DokumenList, type DokumenItem } from "@/components/Dokumen";
import { SearchBox } from "@/components/SearchBox";
import { insensitiveFilter } from "@/lib/search";

export default async function TemanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const [teman, templates] = await Promise.all([
    db.investasiTeman.findMany({
      where: { 
        userId,
        ...(q ? { namaTeman: { contains: q, ...insensitiveFilter() } } : {})
      },
      include: {
        deviden: { orderBy: { tanggal: "desc" } },
        template: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.templateAlokasi.findMany({
      where: { userId },
      orderBy: [{ archivedAt: "asc" }, { isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  const dokumenList = await db.dokumen.findMany({
    where: { userId, tipe: "INVESTASI_TEMAN", refId: { in: teman.map((t) => t.id) } },
    orderBy: { createdAt: "desc" },
  });
  const dokumenByTeman = new Map<number, DokumenItem[]>();
  for (const d of dokumenList) {
    const arr = dokumenByTeman.get(d.refId) ?? [];
    arr.push(d as DokumenItem);
    dokumenByTeman.set(d.refId, arr);
  }

  return (
    <AppShell user={user || { email }} active="/teman">
      <div className="page-header mb-1">
        <h2>Investasi Teman</h2>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
        Kelola modal investasi ke teman/partner. Deviden otomatis menghasilkan kewajiban zakat 2.5%.
      </p>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <TemanForm templates={templates} />
        
        <SearchBox basePath="/teman" initialValue={q} placeholder="Cari teman/partner..." />
      </div>

      <div className="mt-6 space-y-3">
        {teman.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }} className="text-[0.8rem]">Belum ada investasi teman.</p>
        ) : (
          teman.map((t) => {
            const totalDeviden = t.deviden.reduce((s, d) => s + d.jumlah, 0);
            return (
              <div key={t.id} className="card">
                <div className="mb-2.5 flex items-start justify-between">
                  <div>
                    <h3 className="text-[0.85rem] font-semibold" style={{ color: "var(--text-primary)" }}>{t.namaTeman}</h3>
                    <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                      Mulai {formatTanggal(t.tanggalMulai)} •{" "}
                      <span className={t.status === "AKTIF" ? "badge-green" : "badge-muted"}>
                        {t.status}
                      </span>
                    </p>
                    {t.catatan && <p className="mt-0.5 text-[0.75rem]" style={{ color: "var(--text-secondary)" }}>{t.catatan}</p>}
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                        Template: {t.template?.nama ?? "Default"}
                      </p>
                      <TemanEditForm
                        investasiTemanId={t.id}
                        initial={{
                          namaTeman: t.namaTeman,
                          modal: t.modal,
                          tanggalMulai: t.tanggalMulai.toISOString().slice(0, 10),
                          catatan: t.catatan ?? "",
                          templateId: t.template?.id ?? null,
                        }}
                        templates={templates}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="section-title !mb-0.5">Modal</div>
                    <div className="text-[0.9rem] font-bold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(t.modal)}</div>
                    <div className="section-title !mb-0.5 mt-1">Total Deviden</div>
                    <div className="text-[0.8rem] font-semibold" style={{ color: "var(--accent-green)" }}>
                      {formatRupiah(totalDeviden)}
                    </div>
                  </div>
                </div>

                <DevidenForm investasiTemanId={t.id} />

                {t.deviden.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    <div className="section-title">Riwayat Deviden</div>
                    <div className="overflow-y-auto max-h-[300px] space-y-1 pr-1">
                      {t.deviden.map((d) => (
                        <div
                          key={d.id}
                          className="rounded-md px-2.5 py-1.5 text-[0.8rem]"
                          style={{ border: "1px solid var(--bg-border)" }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span style={{ color: "var(--text-secondary)" }}>{formatTanggal(d.tanggal)}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ color: "var(--accent-green)" }}>{formatRupiah(d.jumlah)}</span>
                              <BuktiField tipe="Deviden" id={d.id} buktiPath={d.buktiPath} size={16} />
                              <DevidenEditForm
                                devidenId={d.id}
                                initialTanggal={d.tanggal.toISOString().slice(0, 10)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <DokumenList tipe="INVESTASI_TEMAN" refId={t.id} docs={dokumenByTeman.get(t.id) || []} />
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
