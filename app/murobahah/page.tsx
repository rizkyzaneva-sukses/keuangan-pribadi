import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { MurobahahEditForm, MurobahahForm, ImbalHasilForm } from "./Forms";
import { SearchBox } from "@/components/SearchBox";
import { insensitiveFilter } from "@/lib/search";
import { BuktiThumb } from "@/components/Bukti";

export default async function MurobahahPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const [list, templates] = await Promise.all([
    db.murobahah.findMany({
      where: { 
        userId,
        ...(q ? { namaPartner: { contains: q, ...insensitiveFilter() } } : {})
      },
      include: {
        imbalHasilDiterima: { orderBy: { tanggal: "desc" } },
        template: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.templateAlokasi.findMany({
      where: { userId },
      orderBy: [{ archivedAt: "asc" }, { isDefault: "desc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <AppShell user={user || { email }} active="/murobahah">
      <div className="page-header mb-1">
        <h2>Murobahah</h2>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
        Pembiayaan murobahah. Isi kolom pertama dengan pokok/modal, kolom kedua dengan margin/imbal hasil. Zakat 2.5% dihitung dari margin, bukan dari pokok.
      </p>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <MurobahahForm templates={templates} />
        
        <SearchBox basePath="/murobahah" initialValue={q} placeholder="Cari partner..." />
      </div>

      <div className="mt-6 space-y-3">
        {list.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }} className="text-[0.8rem]">Belum ada murobahah.</p>
        ) : (
          list.map((m) => {
            const totalImbal = m.imbalHasilDiterima.reduce((s, i) => s + i.jumlah, 0);
            const totalPokokDiterima = m.imbalHasilDiterima.reduce((s, i) => s + i.pokokDiterima, 0);
            const estimasiDiterima = m.pokok + m.totalImbalHasil;
            const totalDiterima = totalPokokDiterima + totalImbal;
            const sisaDiterima = estimasiDiterima - totalDiterima;
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
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                        Template: {m.template?.nama ?? "Default"}
                      </p>
                      <MurobahahEditForm
                        murobahahId={m.id}
                        initial={{
                          namaPartner: m.namaPartner,
                          pokok: m.pokok,
                          totalImbalHasil: m.totalImbalHasil,
                          tanggalMulai: m.tanggalMulai.toISOString().slice(0, 10),
                          jatuhTempo: m.jatuhTempo.toISOString().slice(0, 10),
                          catatan: m.catatan ?? "",
                          templateId: m.template?.id ?? null,
                        }}
                        templates={templates}
                      />
                      {m.buktiPath && <BuktiThumb path={m.buktiPath} size={16} />}
                    </div>
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
                      Estimasi diterima:{" "}
                      <span className="font-semibold" style={{ color: "var(--accent-green)" }}>
                        {formatRupiah(estimasiDiterima)}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Diterima:{" "}
                      <span className="font-semibold" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalDiterima)}</span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Sisa: <span className="font-semibold" style={{ color: "var(--accent-gold)" }}>{formatRupiah(sisaDiterima)}</span>
                    </div>
                  </div>
                </div>

                <ImbalHasilForm murobahahId={m.id} />

                {m.imbalHasilDiterima.length > 0 && (
                  <div className="mt-2.5 space-y-1">
                    <div className="section-title">Riwayat Penerimaan</div>
                    <div className="overflow-y-auto max-h-[300px] space-y-1 pr-1">
                      {m.imbalHasilDiterima.map((i) => (
                      <div
                        key={i.id}
                        className="flex justify-between rounded-md px-2.5 py-1.5 text-[0.8rem]"
                        style={{ border: "1px solid var(--bg-border)" }}
                      >
                        <div>
                          <div style={{ color: "var(--text-secondary)" }}>{formatTanggal(i.tanggal)}</div>
                          <div className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                            Pokok {formatRupiah(i.pokokDiterima)} + Imbal {formatRupiah(i.jumlah)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {i.buktiPath && <BuktiThumb path={i.buktiPath} size={14} />}
                          <span className="font-medium" style={{ color: "var(--accent-green)" }}>
                            {formatRupiah(i.pokokDiterima + i.jumlah)}
                          </span>
                        </div>
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
