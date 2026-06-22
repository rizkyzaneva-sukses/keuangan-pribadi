import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PembayaranUtangPiutangButton, UtangPiutangForm } from "./Forms";
import type { Prisma } from "@prisma/client";

export default async function UtangPiutangPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const where: Prisma.UtangPiutangWhereInput = { userId };
  if (sp.jenis === "UTANG" || sp.jenis === "PIUTANG") where.jenis = sp.jenis;
  if (sp.status === "BELUM" || sp.status === "SEBAGIAN" || sp.status === "LUNAS") where.status = sp.status;
  if (sp.q) where.namaPihak = { contains: sp.q };

  const [items, utangRows, piutangRows] = await Promise.all([
    db.utangPiutang.findMany({
      where,
      include: {
        pembayaran: { orderBy: [{ tanggal: "desc" }, { id: "desc" }] },
      },
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
    }),
    db.utangPiutang.findMany({
      where: { userId, jenis: "UTANG", status: { in: ["BELUM", "SEBAGIAN"] } },
      select: { jumlah: true, sudahDibayar: true },
    }),
    db.utangPiutang.findMany({
      where: { userId, jenis: "PIUTANG", status: { in: ["BELUM", "SEBAGIAN"] } },
      select: { jumlah: true, sudahDibayar: true },
    }),
  ]);

  const totalUtang = utangRows.reduce((sum, item) => sum + (item.jumlah - item.sudahDibayar), 0);
  const totalPiutang = piutangRows.reduce((sum, item) => sum + (item.jumlah - item.sudahDibayar), 0);

  return (
    <AppShell user={user || { email }} active="/utang-piutang">
      <div className="page-header mb-1">
        <h2>Utang Piutang</h2>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
        Catat utang dan piutang, cicilan pembayarannya, serta sinkronkan ke kas bila perlu.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="stat-card" style={{ borderColor: "rgba(248, 113, 113, 0.15)" }}>
          <div className="stat-label" style={{ color: "var(--accent-red)" }}>Sisa Utang</div>
          <div className="stat-value" style={{ color: "var(--accent-red)" }}>{formatRupiah(totalUtang)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(52, 211, 153, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-green)" }}>Sisa Piutang</div>
          <div className="stat-value" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalPiutang)}</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <UtangPiutangForm />
        <form method="GET" className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select name="jenis" defaultValue={sp.jenis || ""} className="form-input" style={{ width: "auto" }}>
            <option value="">Semua jenis</option>
            <option value="UTANG">Utang</option>
            <option value="PIUTANG">Piutang</option>
          </select>
          <select name="status" defaultValue={sp.status || ""} className="form-input" style={{ width: "auto" }}>
            <option value="">Semua status</option>
            <option value="BELUM">BELUM</option>
            <option value="SEBAGIAN">SEBAGIAN</option>
            <option value="LUNAS">LUNAS</option>
          </select>
          <input
            type="text"
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Cari nama pihak..."
            className="form-input w-full md:w-56"
          />
          <button type="submit" className="btn-primary px-3 py-1.5 text-[0.8rem]">Filter</button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-[0.8rem]" style={{ color: "var(--text-muted)" }}>Belum ada catatan utang piutang.</p>
        ) : (
          items.map((item) => {
            const sisa = item.jumlah - item.sudahDibayar;
            return (
              <div key={item.id} className="card">
                <div className="mb-2.5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[0.85rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.namaPihak}
                      </h3>
                      <span className={item.jenis === "UTANG" ? "badge-red" : "badge-green"}>
                        {item.jenis}
                      </span>
                      <span className={item.status === "LUNAS" ? "badge-green" : item.status === "SEBAGIAN" ? "badge-yellow" : "badge-red"}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                      Tanggal {formatTanggal(item.tanggal)}
                      {item.jatuhTempo ? <> · Jatuh tempo {formatTanggal(item.jatuhTempo)}</> : null}
                    </p>
                    {item.catatan && (
                      <p className="mt-1 text-[0.75rem]" style={{ color: "var(--text-secondary)" }}>
                        {item.catatan}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="section-title !mb-0.5">Total</div>
                    <div className="text-[0.9rem] font-bold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(item.jumlah)}</div>
                    <div className="mt-1 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                      Terbayar {formatRupiah(item.sudahDibayar)} · Sisa {formatRupiah(sisa)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                    {item.pembayaran.length} transaksi cicilan
                  </div>
                  <PembayaranUtangPiutangButton
                    id={item.id}
                    jenis={item.jenis}
                    namaPihak={item.namaPihak}
                    jumlah={item.jumlah}
                    sudahDibayar={item.sudahDibayar}
                    pembayaran={item.pembayaran.map((p) => ({
                      id: p.id,
                      tanggal: p.tanggal,
                      jumlah: p.jumlah,
                      keterangan: p.keterangan,
                    }))}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
