import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { MurobahahForm, ImbalHasilForm } from "./Forms";

export default async function MurobahahPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const list = await db.murobahah.findMany({
    where: { 
      userId,
      ...(q ? { namaPartner: { contains: q } } : {})
    },
    include: { imbalHasilDiterima: { orderBy: { tanggal: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={user || { email }} active="/murobahah">
      <div className="page-header mb-1">
        <h2>Murobahah</h2>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
        Pembiayaan murobahah. Imbal hasil otomatis menghasilkan kewajiban zakat 2.5%.
      </p>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <MurobahahForm />
        
        <form method="GET" className="flex items-center gap-2 w-full md:w-auto">
          <input 
            type="text" 
            name="q" 
            defaultValue={q} 
            placeholder="Cari partner..." 
            className="form-input w-full md:w-64"
          />
          <button type="submit" className="btn-ghost px-3 py-1.5 text-[0.8rem]">Cari</button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        {list.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }} className="text-[0.8rem]">Belum ada murobahah.</p>
        ) : (
          list.map((m) => {
            const totalImbal = m.imbalHasilDiterima.reduce((s, i) => s + i.jumlah, 0);
            const sisaImbal = m.totalImbalHasil - totalImbal;
            return (
              <div key={m.id} className="card">
                <div className="mb-2.5 flex items-start justify-between">
                  <div>
                    <h3 className="text-[0.85rem] font-semibold" style={{ color: "var(--text-primary)" }}>{m.namaPartner}</h3>
                    <p className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                      {formatTanggal(m.tanggalMulai)} → {formatTanggal(m.jatuhTempo)}{" "}
                      <span className={m.status === "AKTIF" ? "badge-green" : "badge-muted"}>
                        {m.status}
                      </span>
                    </p>
                    {m.catatan && <p className="mt-0.5 text-[0.75rem]" style={{ color: "var(--text-secondary)" }}>{m.catatan}</p>}
                  </div>
                  <div className="text-right text-[0.8rem] space-y-0.5">
                    <div style={{ color: "var(--text-secondary)" }}>
                      Pokok: <span className="font-semibold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(m.pokok)}</span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Total imbal:{" "}
                      <span className="font-semibold" style={{ color: "var(--accent-green)" }}>
                        {formatRupiah(m.totalImbalHasil)}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Diterima:{" "}
                      <span className="font-semibold" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalImbal)}</span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Sisa: <span className="font-semibold" style={{ color: "var(--accent-gold)" }}>{formatRupiah(sisaImbal)}</span>
                    </div>
                  </div>
                </div>

                <ImbalHasilForm murobahahId={m.id} />

                {m.imbalHasilDiterima.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    <div className="section-title">Riwayat Imbal Hasil</div>
                    <div className="overflow-y-auto max-h-[300px] space-y-1 pr-1">
                      {m.imbalHasilDiterima.map((i) => (
                      <div
                        key={i.id}
                        className="flex justify-between rounded-md px-2.5 py-1.5 text-[0.8rem]"
                        style={{ border: "1px solid var(--bg-border)" }}
                      >
                        <span style={{ color: "var(--text-secondary)" }}>{formatTanggal(i.tanggal)}</span>
                        <span className="font-medium" style={{ color: "var(--accent-green)" }}>{formatRupiah(i.jumlah)}</span>
                      </div>
                    ))}
                    </div>
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
