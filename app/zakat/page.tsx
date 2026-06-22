import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { BayarZakatButton } from "./BayarZakatButton";
import { BayarSemuaZakatButton } from "./BayarSemuaZakatButton";
import type { Prisma } from "@prisma/client";

export default async function ZakatPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sumber?: string; tahun?: string }>;
}) {
  const sp = await searchParams;
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const where: Prisma.ZakatWhereInput = { userId };
  if (sp.status === "BELUM" || sp.status === "SEBAGIAN" || sp.status === "SUDAH") where.status = sp.status;
  if (sp.sumber === "DEVIDEN" || sp.sumber === "MUROBAHAH" || sp.sumber === "BISNIS") {
    where.sumber = sp.sumber;
  }
  if (sp.tahun) where.tahun = Number(sp.tahun);

  const [zakat, aggBelum, aggSebagian, aggSudah] = await Promise.all([
    db.zakat.findMany({
      where,
      orderBy: [{ tanggalWajib: "desc" }, { id: "desc" }],
      take: 100,
      include: { pembayaran: { orderBy: [{ tanggal: "desc" }, { id: "desc" }] } },
    }),
    db.zakat.aggregate({ where: { userId, status: "BELUM" }, _sum: { jumlah: true }, _count: true }),
    db.zakat.aggregate({ where: { userId, status: "SEBAGIAN" }, _sum: { jumlah: true, sudahDibayar: true }, _count: true }),
    db.zakat.aggregate({ where: { userId, status: "SUDAH" }, _sum: { jumlah: true }, _count: true }),
  ]);

  // Hitung sisa: belum + (sebagian – terbayar)
  const zakatSebagianRows = await db.zakat.findMany({
    where: { userId, status: "SEBAGIAN" },
    select: { jumlah: true, sudahDibayar: true },
  });
  const sisaSebagian = zakatSebagianRows.reduce((acc, z) => acc + (z.jumlah - z.sudahDibayar), 0);
  const totalSisa = (aggBelum._sum.jumlah || 0) + sisaSebagian;
  const totalSudah = aggSudah._sum.jumlah || 0;

  const tahunList = Array.from(new Set(zakat.map((z) => z.tahun))).sort((a, b) => b - a);

  return (
    <AppShell user={user || { email }} active="/zakat">
      <div className="page-header mb-5">
        <h2>Zakat</h2>
        <p>Kelola kewajiban zakat penghasilan dan investasi.</p>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="stat-card" style={{ borderColor: "rgba(212, 168, 67, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-gold)" }}>Belum & Cicilan</div>
          <div className="stat-value" style={{ color: "var(--accent-gold)" }}>
            {formatRupiah(totalSisa)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {aggBelum._count} belum · {aggSebagian._count} cicilan
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(248, 113, 113, 0.15)" }}>
          <div className="stat-label" style={{ color: "var(--accent-red)" }}>Sedang Dicicil</div>
          <div className="stat-value" style={{ color: "var(--accent-red)" }}>
            {formatRupiah(aggSebagian._count > 0 ? zakatSebagianRows.reduce((a, z) => a + z.sudahDibayar, 0) : 0)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            sudah dibayar dari kewajiban cicilan
          </div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(52, 211, 153, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-green)" }}>Sudah Lunas</div>
          <div className="stat-value" style={{ color: "var(--accent-green)" }}>
            {formatRupiah(totalSudah)}
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {aggSudah._count} kewajiban selesai
          </div>
        </div>
      </div>

      {/* Filter */}
      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <select name="status" defaultValue={sp.status || ""} className="form-input" style={{ width: "auto" }}>
          <option value="">Semua status</option>
          <option value="BELUM">BELUM</option>
          <option value="SEBAGIAN">SEBAGIAN</option>
          <option value="SUDAH">SUDAH</option>
        </select>
        <select name="sumber" defaultValue={sp.sumber || ""} className="form-input" style={{ width: "auto" }}>
          <option value="">Semua sumber</option>
          <option value="DEVIDEN">DEVIDEN</option>
          <option value="MUROBAHAH">MUROBAHAH</option>
          <option value="BISNIS">BISNIS</option>
        </select>
        <select name="tahun" defaultValue={sp.tahun || ""} className="form-input" style={{ width: "auto" }}>
          <option value="">Semua tahun</option>
          {tahunList.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="btn-primary px-3 py-1.5 text-[0.8rem]">Filter</button>
      </form>

      <BayarSemuaZakatButton
        totalSisa={totalSisa}
        jumlahItem={aggBelum._count + aggSebagian._count}
      />

      {/* Tabel */}
      <div className="overflow-hidden rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)]">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tahun</th>
              <th>Sumber</th>
              <th>Tgl Wajib</th>
              <th>Status</th>
              <th>Catatan</th>
              <th className="text-right">Kewajiban</th>
              <th className="text-right">Terbayar</th>
              <th className="text-right">Sisa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zakat.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                  Belum ada zakat
                </td>
              </tr>
            ) : (
              zakat.map((z) => {
                const sisa = z.jumlah - z.sudahDibayar;
                const pct = z.jumlah > 0 ? Math.round((z.sudahDibayar / z.jumlah) * 100) : 0;
                return (
                  <tr key={z.id}>
                    <td>{z.tahun}</td>
                    <td>
                      <span className="badge-muted">{z.sumber}</span>
                    </td>
                    <td>{formatTanggal(z.tanggalWajib)}</td>
                    <td>
                      {z.status === "SUDAH" && <span className="badge-green">LUNAS</span>}
                      {z.status === "SEBAGIAN" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span className="badge-yellow">CICILAN</span>
                          {/* mini progress */}
                          <div style={{
                            height: "3px", width: "4rem",
                            borderRadius: "9999px",
                            backgroundColor: "var(--bg-border)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%", width: `${pct}%`,
                              backgroundColor: "var(--accent-gold)",
                              borderRadius: "9999px",
                            }} />
                          </div>
                        </div>
                      )}
                      {z.status === "BELUM" && <span className="badge-red">BELUM</span>}
                    </td>
                    <td className="text-[0.75rem]">{z.catatan || "-"}</td>
                    <td className="text-right font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatRupiah(z.jumlah)}
                    </td>
                    <td className="text-right" style={{ color: z.sudahDibayar > 0 ? "var(--accent-green)" : "var(--text-muted)" }}>
                      {z.sudahDibayar > 0 ? formatRupiah(z.sudahDibayar) : "-"}
                    </td>
                    <td className="text-right" style={{ color: sisa > 0 ? "var(--accent-gold)" : "var(--text-muted)" }}>
                      {sisa > 0 ? formatRupiah(sisa) : "-"}
                    </td>
                    <td className="text-right">
                      <BayarZakatButton
                        id={z.id}
                        jumlah={z.jumlah}
                        sudahDibayar={z.sudahDibayar}
                        status={z.status}
                        pembayaran={z.pembayaran.map((p) => ({
                          id: p.id,
                          tanggal: p.tanggal,
                          jumlah: p.jumlah,
                          keterangan: p.keterangan,
                        }))}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
