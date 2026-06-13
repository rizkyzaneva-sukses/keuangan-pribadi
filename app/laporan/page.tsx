import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { formatRupiah, formatTanggal } from "@/lib/format";

export default async function LaporanPage() {
  const { userId, email } = await requireUser();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true, email: true },
  });

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [walletPos, kasThisYear, investasiSummary, zakatSummary] = await Promise.all([
    db.walletPos.findMany({
      where: { userId },
      include: { pos: true },
      orderBy: { pos: { urutan: "asc" } },
    }),
    db.kas.aggregate({
      where: { userId, tanggal: { gte: startOfYear } },
      _sum: { jumlah: true },
      _count: true,
    }),
    db.trxInvestasi.groupBy({
      by: ["arah"],
      where: { userId },
      _sum: { total: true, profit: true },
      _count: true,
    }),
    db.zakat.aggregate({
      where: { userId },
      _sum: { jumlah: true, sudahDibayar: true },
      _count: true,
    }),
  ]);

  const totalSaldoWallet = walletPos.reduce((sum, w) => sum + w.saldoSaatIni, 0);

  const kasMasuk = await db.kas.aggregate({
    where: { userId, tanggal: { gte: startOfYear }, jenis: "MASUK" },
    _sum: { jumlah: true },
  });
  const kasKeluar = await db.kas.aggregate({
    where: { userId, tanggal: { gte: startOfYear }, jenis: "KELUAR" },
    _sum: { jumlah: true },
  });

  const totalModalOUT = investasiSummary
    .filter((s) => s.arah === "OUT")
    .reduce((acc, s) => acc + (s._sum.total || 0), 0);
  const totalReturnIN = investasiSummary
    .filter((s) => s.arah === "IN")
    .reduce((acc, s) => acc + (s._sum.total || 0), 0);
  const totalProfit = investasiSummary
    .filter((s) => s.arah === "IN")
    .reduce((acc, s) => acc + (s._sum.profit || 0), 0);

  const totalZakat = zakatSummary._sum.jumlah || 0;
  const totalZakatDibayar = zakatSummary._sum.sudahDibayar || 0;
  const sisaZakat = totalZakat - totalZakatDibayar;

  return (
    <AppShell user={user || { email }} active="/laporan">
      <div className="page-header mb-5 flex items-center justify-between">
        <div>
          <h2>Laporan Keuangan</h2>
          <p>Ringkasan keuangan {now.getFullYear()} — bisa di-print atau export.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-primary px-4 py-2 text-sm font-medium no-print"
        >
          🖨️ Print / PDF
        </button>
      </div>

      {/* Ringkasan Utama */}
      <div className="mb-6 rounded-lg p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
        <h3 className="mb-4 text-base font-bold" style={{ color: "var(--accent-gold)" }}>
          Ringkasan Keuangan — {now.getFullYear()}
        </h3>
        <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>
          Per {formatTanggal(now)} • User: {user?.nama || email}
        </p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Total Saldo Wallet</div>
            <div className="text-lg font-bold" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalSaldoWallet)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Kas Masuk (YTD)</div>
            <div className="text-lg font-bold" style={{ color: "var(--accent-green)" }}>{formatRupiah(kasMasuk._sum.jumlah || 0)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Kas Keluar (YTD)</div>
            <div className="text-lg font-bold" style={{ color: "var(--accent-red)" }}>{formatRupiah(kasKeluar._sum.jumlah || 0)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Saldo Kas Bersih</div>
            <div className="text-lg font-bold" style={{ color: "var(--accent-blue)" }}>
              {formatRupiah((kasMasuk._sum.jumlah || 0) - (kasKeluar._sum.jumlah || 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Wallet Pos */}
      <div className="mb-6 rounded-lg p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
        <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Detail Wallet Pos</h3>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--bg-border)" }}>
              <th className="pb-2 text-left" style={{ color: "var(--text-muted)" }}>Pos</th>
              <th className="pb-2 text-right" style={{ color: "var(--text-muted)" }}>Saldo</th>
              <th className="pb-2 text-right" style={{ color: "var(--text-muted)" }}>Total Masuk</th>
              <th className="pb-2 text-right" style={{ color: "var(--text-muted)" }}>Total Keluar</th>
            </tr>
          </thead>
          <tbody>
            {walletPos.map((w) => (
              <tr key={w.id} style={{ borderBottom: "1px solid var(--bg-border)" }}>
                <td className="py-2" style={{ color: "var(--text-primary)" }}>{w.pos.nama}</td>
                <td className="py-2 text-right font-medium" style={{ color: "var(--accent-green)" }}>{formatRupiah(w.saldoSaatIni)}</td>
                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatRupiah(w.totalMasuk)}</td>
                <td className="py-2 text-right" style={{ color: "var(--text-secondary)" }}>{formatRupiah(w.totalKeluar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Investasi Summary */}
      <div className="mb-6 rounded-lg p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
        <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Ringkasan Investasi</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Total Modal OUT</div>
            <div className="text-base font-bold" style={{ color: "var(--accent-red)" }}>{formatRupiah(totalModalOUT)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Total Return IN</div>
            <div className="text-base font-bold" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalReturnIN)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Total Profit</div>
            <div className="text-base font-bold" style={{ color: "var(--accent-blue)" }}>{formatRupiah(totalProfit)}</div>
          </div>
        </div>
      </div>

      {/* Zakat Summary */}
      <div className="mb-6 rounded-lg p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--bg-border)" }}>
        <h3 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>Ringkasan Zakat</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Total Kewajiban</div>
            <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{formatRupiah(totalZakat)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Sudah Dibayar</div>
            <div className="text-base font-bold" style={{ color: "var(--accent-green)" }}>{formatRupiah(totalZakatDibayar)}</div>
          </div>
          <div>
            <div className="text-xs uppercase" style={{ color: "var(--text-muted)" }}>Sisa Kewajiban</div>
            <div className="text-base font-bold" style={{ color: sisaZakat > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>{formatRupiah(sisaZakat)}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[0.65rem] mt-8" style={{ color: "var(--text-muted)" }}>
        Laporan ini di-generate otomatis oleh sistem Keuangan Pribadi • {formatTanggal(now)}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .stat-card, .card, [style*="bg-surface"] { 
            border-color: #ddd !important; 
            background: white !important; 
          }
        }
      `}</style>
    </AppShell>
  );
}
