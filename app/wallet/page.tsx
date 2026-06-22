import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { PenarikanForm } from "./PenarikanForm";
import { ResetWalletButton } from "./ResetWalletButton";

export default async function WalletPage() {
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({ where: { id: userId }, select: { nama: true, email: true } });

  const walletPos = await db.walletPos.findMany({
    where: { userId },
    include: { pos: true },
    orderBy: { pos: { urutan: "asc" } },
  });

  const penarikan = await db.penarikan.findMany({
    where: { userId },
    include: { walletPos: { include: { pos: true } } },
    orderBy: { tanggal: "desc" },
    take: 30,
  });

  const totalSaldo = walletPos.reduce((s, w) => s + w.saldoSaatIni, 0);

  return (
    <AppShell user={user || { email }} active="/wallet">
      <div className="page-header mb-1">
        <h2>Wallet Pos</h2>
      </div>
      <p className="mb-5 text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>
        Total saldo wallet:{" "}
        <span className="font-semibold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(totalSaldo)}</span>
      </p>
      <p className="mb-5 text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
        Wallet baru muncul otomatis saat Anda menambahkan pos baru di <a href="/templates" style={{ color: "var(--accent-gold)" }}>Template Alokasi</a>.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {walletPos.map((w) => (
          <div key={w.id} className="stat-card">
            <div className="text-[0.8rem] font-medium" style={{ color: "var(--text-primary)" }}>{w.pos.nama}</div>
            <div className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>{w.pos.persentase}% alokasi</div>
            <div className="mt-1.5 text-[1rem] font-bold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(w.saldoSaatIni)}</div>
            <div className="mt-1 text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
              In: {formatRupiah(w.totalMasuk)} • Out: {formatRupiah(w.totalKeluar)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <PenarikanForm walletPos={walletPos.map((w) => ({ id: w.id, nama: w.pos.nama, saldo: w.saldoSaatIni }))} />
        <ResetWalletButton totalSaldo={totalSaldo} />
      </div>

      <div className="mt-6 mb-3 page-header">
        <h2 style={{ fontSize: "0.9rem" }}>Riwayat Penarikan</h2>
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)]">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pos</th>
              <th>Akun</th>
              <th>Keterangan</th>
              <th className="text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {penarikan.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                  Belum ada penarikan
                </td>
              </tr>
            ) : (
              penarikan.map((p) => (
                <tr key={p.id}>
                  <td>{formatTanggal(p.tanggal)}</td>
                  <td>{p.walletPos.pos.nama}</td>
                  <td>{p.akun || "-"}</td>
                  <td>{p.keterangan || "-"}</td>
                  <td className="text-right font-medium" style={{ color: "var(--accent-gold)" }}>
                    {formatRupiah(p.nominal)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
