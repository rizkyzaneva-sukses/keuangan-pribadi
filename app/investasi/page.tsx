import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { InvestasiEditForm, InvestasiForm, TrxForm } from "./Forms";
import { OverrideForm } from "./OverrideForm";
import { BuktiThumb } from "@/components/Bukti";
import { SearchBox } from "@/components/SearchBox";
import { insensitiveFilter } from "@/lib/search";

export default async function InvestasiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true, email: true },
  });

  const [investasi, templates] = await Promise.all([
    db.investasi.findMany({
      where: { 
        userId,
        ...(q ? { nama: { contains: q, ...insensitiveFilter() } } : {})
      },
      include: {
        transaksi: { orderBy: { tanggal: "desc" } },
        templateAssignment: { include: { template: { include: { pos: { orderBy: { urutan: "asc" } } } } } },
        overrides: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.templateAlokasi.findMany({ where: { userId }, orderBy: { nama: "asc" } }),
  ]);

  const totalModal = investasi.reduce((sum, inv) => {
    return (
      sum +
      inv.transaksi
        .filter((t) => t.arah === "OUT")
        .reduce((s, t) => s + t.total, 0)
    );
  }, 0);

  const totalReturn = investasi.reduce((sum, inv) => {
    return (
      sum +
      inv.transaksi
        .filter((t) => t.arah === "IN")
        .reduce((s, t) => s + t.total, 0)
    );
  }, 0);

  const totalProfit = investasi.reduce((sum, inv) => {
    return (
      sum +
      inv.transaksi
        .filter((t) => t.arah === "IN")
        .reduce((s, t) => s + t.profit, 0)
    );
  }, 0);

  const aktifCount = investasi.filter((i) => i.status === "ACTIVE").length;
  const defaultTemplate = templates.find((t) => t.isDefault);

  return (
    <AppShell user={user || { email }} active="/investasi">
      {/* Header */}
      <div className="page-header mb-5">
        <h2>Portofolio Investasi</h2>
        <p>Kelola portofolio investasi &amp; transaksinya. Profit dari transaksi IN otomatis dialokasikan ke wallet pos sesuai template.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
        <div className="stat-card">
          <div className="stat-label">Investasi Aktif</div>
          <div className="stat-value" style={{ color: "var(--accent-gold)" }}>{aktifCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Modal OUT</div>
          <div className="stat-value" style={{ color: "var(--accent-red)", fontSize: "0.9rem" }}>{formatRupiah(totalModal)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Return IN</div>
          <div className="stat-value" style={{ color: "var(--accent-green)", fontSize: "0.9rem" }}>{formatRupiah(totalReturn)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Profit</div>
          <div className="stat-value" style={{ color: "var(--accent-blue)", fontSize: "0.9rem" }}>{formatRupiah(totalProfit)}</div>
        </div>
      </div>

      {/* Add Button & Search */}
      <div className="mb-5 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <InvestasiForm templates={templates.map((t) => ({ id: t.id, nama: t.nama }))} />
        
        <SearchBox basePath="/investasi" initialValue={q} placeholder="Cari investasi..." />
      </div>

      {/* Investasi List */}
      <div className="space-y-3">
        {investasi.length === 0 ? (
          <div className="card text-center py-10">
            <div className="text-2xl mb-2">📈</div>
            <p className="text-[0.8rem] font-medium" style={{ color: "var(--text-secondary)" }}>Belum ada investasi.</p>
            <p className="text-[0.75rem] mt-0.5" style={{ color: "var(--text-muted)" }}>Klik &quot;+ Tambah Investasi&quot; untuk memulai.</p>
          </div>
        ) : (
          investasi.map((inv) => {
            const totalIn = inv.transaksi
              .filter((t) => t.arah === "IN")
              .reduce((s, t) => s + t.total, 0);
            const totalOut = inv.transaksi
              .filter((t) => t.arah === "OUT")
              .reduce((s, t) => s + t.total, 0);
            const profitBersih = totalIn - totalOut;

            return (
              <div
                key={inv.id}
                className="card"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-[0.85rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {inv.nama}
                      </h3>
                      <span className="badge-yellow">{inv.tipe}</span>
                      <span className={inv.status === "ACTIVE" ? "badge-green" : "badge-muted"}>
                        {inv.status}
                      </span>
                    </div>
                    {inv.partner && (
                      <p className="text-[0.7rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Partner: {inv.partner}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                        Template: {inv.templateAssignment?.template.nama ?? defaultTemplate?.nama ?? "Belum assign"}
                      </p>
                      {!inv.templateAssignment && defaultTemplate && (
                        <span className="badge-green">DEFAULT</span>
                      )}
                      <InvestasiEditForm
                        investasiId={inv.id}
                        initial={{
                          nama: inv.nama,
                          partner: inv.partner ?? "",
                          tipe: inv.tipe,
                          catatan: inv.catatan ?? "",
                          templateId: inv.templateAssignment?.template.id ?? null,
                        }}
                        templates={templates.map((t) => ({ id: t.id, nama: t.nama }))}
                      />
                      <OverrideForm
                        investasiId={inv.id}
                        investasiNama={inv.nama}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 text-right shrink-0">
                    <div>
                      <div className="section-title !mb-0.5">Modal OUT</div>
                      <div className="text-[0.75rem] font-semibold" style={{ color: "var(--accent-red)" }}>
                        {formatRupiah(totalOut)}
                      </div>
                    </div>
                    <div>
                      <div className="section-title !mb-0.5">Return IN</div>
                      <div className="text-[0.75rem] font-semibold" style={{ color: "var(--accent-green)" }}>
                        {formatRupiah(totalIn)}
                      </div>
                    </div>
                    <div>
                      <div className="section-title !mb-0.5">Profit</div>
                      <div
                        className="text-[0.75rem] font-semibold"
                        style={{ color: profitBersih >= 0 ? "var(--accent-blue)" : "var(--accent-red)" }}
                      >
                        {profitBersih >= 0 ? "+" : ""}{formatRupiah(profitBersih)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Trx Button */}
                <div className="mb-2.5">
                  <TrxForm investasiId={inv.id} />
                </div>

                {/* Transaction Table */}
                {inv.transaksi.length > 0 && (
                  <div className="overflow-x-auto overflow-y-auto max-h-[300px] rounded-md border border-[var(--bg-border)]">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {["Tanggal", "Arah", "Kategori", "Principal", "Profit", "Total", "Bukti", "✓"].map((h) => (
                            <th key={h} className={h === "✓" || h === "Bukti" ? "text-center" : ""}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {inv.transaksi.map((t) => (
                          <tr key={t.id}>
                            <td>{formatTanggal(t.tanggal)}</td>
                            <td>
                              <span className={t.arah === "IN" ? "badge-green" : "badge-red"}>
                                {t.arah}
                              </span>
                            </td>
                            <td>{t.kategori.replace(/_/g, " ")}</td>
                            <td>{formatRupiah(t.principal)}</td>
                            <td style={{ color: "var(--accent-green)" }}>{formatRupiah(t.profit)}</td>
                            <td className="font-semibold" style={{ color: "var(--text-primary)" }}>
                               {formatRupiah(t.total)}
                             </td>
                             <td className="text-center">
                               {t.buktiPath ? (
                                 <BuktiThumb path={t.buktiPath} />
                               ) : (
                                 <span style={{ color: "var(--text-muted)" }}>–</span>
                               )}
                             </td>
                             <td className="text-center">
                              {t.sudahDialokasikan ? (
                                <span style={{ color: "var(--accent-green)" }}>✓</span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>–</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
