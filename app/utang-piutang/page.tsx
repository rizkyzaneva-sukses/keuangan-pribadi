import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import {
  PembayaranUtangPiutangButton,
  UtangPiutangForm,
  UtangPiutangFilters,
  UtangPiutangEditForm,
  UtangPiutangDeleteButton,
} from "./Forms";
import { insensitiveFilter } from "@/lib/search";
import { BuktiField } from "@/components/Bukti";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

export default async function UtangPiutangPage({
  searchParams,
}: {
  searchParams: Promise<{ jenis?: string; status?: string; q?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const where: Prisma.UtangPiutangWhereInput = { userId };
  if (sp.jenis === "UTANG" || sp.jenis === "PIUTANG") where.jenis = sp.jenis;
  if (sp.status === "BELUM" || sp.status === "SEBAGIAN" || sp.status === "LUNAS") where.status = sp.status;
  if (sp.q) where.namaPihak = { contains: sp.q, ...insensitiveFilter() };

  // Determine sort
  const sort = sp.sort || "terbaru";

  const [items, utangRows, piutangRows] = await Promise.all([
    db.utangPiutang.findMany({
      where,
      include: {
        pembayaran: { orderBy: [{ tanggal: "desc" }, { id: "desc" }] },
      },
      orderBy: sort === "jatuh_tempo"
        ? [{ jatuhTempo: "asc" }, { tanggal: "desc" }]
        : sort === "nominal"
        ? [{ jumlah: "desc" }, { tanggal: "desc" }]
        : [{ tanggal: "desc" }, { id: "desc" }],
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

  // === Improvement #1: Dashboard Summary Lebih Lengkap ===
  const totalSudahDibayar = items
    .filter((i) => i.status !== "LUNAS")
    .reduce((sum, i) => sum + i.sudahDibayar, 0);
  const jumlahAktif = items.filter((i) => i.status !== "LUNAS").length;

  // Jatuh tempo bulan ini
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const jatuhTempoBulanIni = items.filter((i) => {
    if (!i.jatuhTempo || i.status === "LUNAS") return false;
    const jt = new Date(i.jatuhTempo);
    return jt >= startOfMonth && jt <= endOfMonth;
  }).length;

  // === Improvement #3: Overdue detection ===
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const isOverdue = (item: (typeof items)[0]) => {
    if (!item.jatuhTempo || item.status === "LUNAS") return false;
    return new Date(item.jatuhTempo) < todayStart;
  };

  // === Improvement #5: Rekap Bulanan ===
  const bulanAwal = new Date(now.getFullYear(), now.getMonth(), 1);
  const bulanAkhir = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [allItemsThisMonth, pembayaranThisMonth] = await Promise.all([
    db.utangPiutang.findMany({
      where: {
        userId,
        OR: [
          { tanggal: { gte: bulanAwal, lte: bulanAkhir } },
        ],
      },
      select: { jenis: true, jumlah: true, tanggal: true },
    }),
    db.pembayaranUtangPiutang.findMany({
      where: {
        userId,
        tanggal: { gte: bulanAwal, lte: bulanAkhir },
      },
      select: { jumlah: true },
    }),
  ]);

  const utangBaruBulan = allItemsThisMonth
    .filter((i) => i.jenis === "UTANG")
    .reduce((s, i) => s + i.jumlah, 0);
  const piutangBaruBulan = allItemsThisMonth
    .filter((i) => i.jenis === "PIUTANG")
    .reduce((s, i) => s + i.jumlah, 0);
  const totalCicilanBulan = pembayaranThisMonth.reduce((s, i) => s + i.jumlah, 0);

  const monthName = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <AppShell user={user || { email }} active="/utang-piutang">
      <div className="page-header mb-1">
        <div className="flex items-center justify-between">
          <h2>Utang Piutang</h2>
          <Link
            href="/investasi"
            className="text-[0.75rem] font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-white/5"
            style={{ color: "var(--accent-gold)", border: "1px solid rgba(212,168,67,0.3)" }}
          >
            📈 Lihat Investasi
          </Link>
        </div>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
        Catat utang dan piutang, cicilan pembayarannya, serta sinkronkan ke kas bila perlu.
      </p>

      {/* Improvement #1: Dashboard Summary Lebih Lengkap — 4 stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="stat-card" style={{ borderColor: "rgba(248, 113, 113, 0.15)" }}>
          <div className="stat-label" style={{ color: "var(--accent-red)" }}>Sisa Utang</div>
          <div className="stat-value" style={{ color: "var(--accent-red)" }}>{formatRupiah(totalUtang)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(52, 211, 153, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-green)" }}>Sisa Piutang</div>
          <div className="stat-value" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalPiutang)}</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(251, 191, 36, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-gold)" }}>JT Bulan Ini</div>
          <div className="stat-value" style={{ color: "var(--accent-gold)" }}>{jatuhTempoBulanIni} item</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(99, 102, 241, 0.2)" }}>
          <div className="stat-label" style={{ color: "var(--accent-blue)" }}>Sudah Terbayar</div>
          <div className="stat-value" style={{ color: "var(--accent-blue)", fontSize: "0.9rem" }}>{formatRupiah(totalSudahDibayar)}</div>
        </div>
      </div>

      {/* Improvement #5: Rekap Bulanan */}
      <div className="mb-5 card" style={{ borderColor: "rgba(99, 102, 241, 0.2)" }}>
        <div className="section-title mb-3">📊 Rekap {monthName}</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>Utang Baru</div>
            <div className="text-[0.85rem] font-bold" style={{ color: "var(--accent-red)" }}>{formatRupiah(utangBaruBulan)}</div>
          </div>
          <div className="text-center">
            <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>Piutang Baru</div>
            <div className="text-[0.85rem] font-bold" style={{ color: "var(--accent-green)" }}>{formatRupiah(piutangBaruBulan)}</div>
          </div>
          <div className="text-center">
            <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>Cicilan Dibayar</div>
            <div className="text-[0.85rem] font-bold" style={{ color: "var(--accent-gold)" }}>{formatRupiah(totalCicilanBulan)}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <UtangPiutangForm />
        <UtangPiutangFilters
          jenis={sp.jenis || ""}
          status={sp.status || ""}
          q={sp.q || ""}
          sort={sort}
        />
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-[0.8rem]" style={{ color: "var(--text-muted)" }}>Belum ada catatan utang piutang.</p>
        ) : (
          items.map((item) => {
            const sisa = item.jumlah - item.sudahDibayar;
            const pct = item.jumlah > 0 ? Math.round((item.sudahDibayar / item.jumlah) * 100) : 0;
            const overdue = isOverdue(item);
            const daysUntilDue = item.jatuhTempo
              ? Math.ceil((new Date(item.jatuhTempo).getTime() - todayStart.getTime()) / 86400000)
              : null;

            return (
              <div
                key={item.id}
                className="card"
                style={overdue ? { border: "1px solid rgba(248, 113, 113, 0.5)", boxShadow: "0 0 0 1px rgba(248, 113, 113, 0.1)" } : undefined}
              >
                <div className="mb-2.5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
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
                      {overdue && (
                        <span className="badge-red" style={{ backgroundColor: "rgba(248, 113, 113, 0.2)" }}>
                          ⚠ OVERDUE
                        </span>
                      )}
                      {!overdue && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7 && item.status !== "LUNAS" && (
                        <span className="badge-yellow">
                          ⏰ {daysUntilDue === 0 ? "Hari ini" : `${daysUntilDue} hari lagi`}
                        </span>
                      )}
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
                    <div className="mt-1.5">
                      <BuktiField tipe="UtangPiutang" id={item.id} buktiPath={item.buktiPath} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="section-title !mb-0.5">Total</div>
                    <div className="text-[0.95rem] font-bold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(item.jumlah)}</div>
                  </div>
                </div>

                <div
                  style={{
                    height: "6px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--bg-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      borderRadius: "9999px",
                      backgroundColor: pct === 100 ? "var(--accent-green)" : "var(--accent-gold)",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[0.75rem] font-medium">
                  <span style={{ color: "var(--accent-green)" }}>Terbayar {formatRupiah(item.sudahDibayar)}</span>
                  <span style={{ color: "var(--text-primary)" }}>{pct}%</span>
                  <span style={{ color: "var(--accent-red)" }}>Sisa {formatRupiah(sisa)}</span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
                      {item.pembayaran.length} transaksi cicilan
                    </div>
                    <UtangPiutangEditForm
                      id={item.id}
                      initialJenis={item.jenis}
                      initialNamaPihak={item.namaPihak}
                      initialTanggal={item.tanggal}
                      initialJatuhTempo={item.jatuhTempo}
                      initialJumlah={item.jumlah}
                      initialCatatan={item.catatan}
                      initialBuktiPath={item.buktiPath}
                    />
                    <UtangPiutangDeleteButton
                      id={item.id}
                      jenis={item.jenis}
                      namaPihak={item.namaPihak}
                    />
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
                      buktiPath: p.buktiPath,
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
