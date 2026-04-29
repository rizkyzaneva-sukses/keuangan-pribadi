import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { KasForm } from "./KasForm";

export default async function KasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; jenis?: string; kategoriId?: string }>;
}) {
  const sp = await searchParams;
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const page = Number(sp.page || 1);
  const perPage = 20;

  const where: any = { userId };
  if (sp.jenis === "MASUK" || sp.jenis === "KELUAR") where.jenis = sp.jenis;
  if (sp.kategoriId) where.kategoriId = Number(sp.kategoriId);

  const [kas, total, kategoriList, sumMasuk, sumKeluar] = await Promise.all([
    db.kas.findMany({
      where,
      include: { kategori: true },
      orderBy: { tanggal: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.kas.count({ where }),
    db.kategoriKas.findMany({ where: { userId }, orderBy: { nama: "asc" } }),
    db.kas.aggregate({ where: { userId, jenis: "MASUK" }, _sum: { jumlah: true } }),
    db.kas.aggregate({ where: { userId, jenis: "KELUAR" }, _sum: { jumlah: true } }),
  ]);

  const totalPage = Math.ceil(total / perPage);
  const masuk = sumMasuk._sum.jumlah || 0;
  const keluar = sumKeluar._sum.jumlah || 0;

  return (
    <AppShell user={user || { email }} active="/kas">
      <div className="page-header mb-5">
        <h2>Kas Harian</h2>
        <p>Catatan pemasukan dan pengeluaran harian Anda.</p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="stat-card" style={{ borderColor: "rgba(52, 211, 153, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-green)" }}>Total Masuk</div>
          <div className="stat-value" style={{ color: "var(--accent-green)" }}>{formatRupiah(masuk)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(248, 113, 113, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-red)" }}>Total Keluar</div>
          <div className="stat-value" style={{ color: "var(--accent-red)" }}>{formatRupiah(keluar)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(96, 165, 250, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-blue)" }}>Saldo</div>
          <div className="stat-value" style={{ color: "var(--accent-blue)" }}>{formatRupiah(masuk - keluar)}</div>
        </div>
      </div>

      <KasForm kategoriList={kategoriList.map((k) => ({ id: k.id, nama: k.nama }))} />

      <form className="mt-5 mb-3 flex flex-wrap gap-2" method="GET">
        <select
          name="jenis"
          defaultValue={sp.jenis || ""}
          className="form-input"
          style={{ width: "auto" }}
        >
          <option value="">Semua jenis</option>
          <option value="MASUK">Masuk</option>
          <option value="KELUAR">Keluar</option>
        </select>
        <select
          name="kategoriId"
          defaultValue={sp.kategoriId || ""}
          className="form-input"
          style={{ width: "auto" }}
        >
          <option value="">Semua kategori</option>
          {kategoriList.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
        <button className="btn-primary px-3 py-1.5 text-[0.8rem]">Filter</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)]">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Kategori</th>
              <th>Keterangan</th>
              <th className="text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {kas.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                  Belum ada transaksi
                </td>
              </tr>
            ) : (
              kas.map((k) => (
                <tr key={k.id}>
                  <td>{formatTanggal(k.tanggal)}</td>
                  <td>
                    <span className={k.jenis === "MASUK" ? "badge-green" : "badge-red"}>
                      {k.jenis}
                    </span>
                  </td>
                  <td>{k.kategori.nama}</td>
                  <td>{k.keterangan}</td>
                  <td
                    className="text-right font-medium"
                    style={{ color: k.jenis === "MASUK" ? "var(--accent-green)" : "var(--accent-red)" }}
                  >
                    {k.jenis === "MASUK" ? "+" : "-"}
                    {formatRupiah(k.jumlah)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPage > 1 && (
        <div className="mt-3 flex items-center justify-between text-[0.8rem]">
          <span style={{ color: "var(--text-muted)" }}>
            Halaman {page} dari {totalPage} ({total} transaksi)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}`}
                className="btn-ghost px-3 py-1 text-[0.8rem]"
              >
                ← Sebelumnya
              </a>
            )}
            {page < totalPage && (
              <a
                href={`?page=${page + 1}`}
                className="btn-ghost px-3 py-1 text-[0.8rem]"
              >
                Selanjutnya →
              </a>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
