import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { formatRupiah } from "@/lib/format";
import { KasTrendChart, WalletDistributionChart } from "@/components/Charts";
import { ResetWalletButton } from "@/app/wallet/ResetWalletButton";

export default async function DashboardPage() {
  const { userId, email } = await requireUser();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { nama: true, email: true },
  });

  // Hitung 6 bulan terakhir untuk chart
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [walletPos, totalKas, totalInvestasi, pendingZakatList, kasMonthly] = await Promise.all([
    db.walletPos.findMany({
      where: { userId },
      include: { pos: true },
      orderBy: { pos: { urutan: "asc" } },
    }),
    db.kas.aggregate({
      where: { userId },
      _sum: { jumlah: true },
    }),
    db.trxInvestasi.count({ where: { userId } }),
    db.zakat.findMany({
      where: { userId, status: { in: ["BELUM", "SEBAGIAN"] } },
      select: { sumber: true, jumlah: true, sudahDibayar: true },
    }),
    db.kas.findMany({
      where: {
        userId,
        tanggal: { gte: sixMonthsAgo },
      },
      select: { tanggal: true, jenis: true, jumlah: true },
      orderBy: { tanggal: "asc" },
    }),
  ]);

  const totalSaldoWallet = walletPos.reduce((sum, w) => sum + w.saldoSaatIni, 0);

  // Zakat calculations
  const totalSisaZakat = pendingZakatList.reduce((acc, z) => acc + (z.jumlah - z.sudahDibayar), 0);

  const zakatMurobahahItems = pendingZakatList.filter(z => z.sumber === "MUROBAHAH");
  const sisaMurobahah = zakatMurobahahItems.reduce((acc, z) => acc + (z.jumlah - z.sudahDibayar), 0);

  const zakatDevidenItems = pendingZakatList.filter(z => z.sumber === "DEVIDEN");
  const sisaDeviden = zakatDevidenItems.reduce((acc, z) => acc + (z.jumlah - z.sudahDibayar), 0);

  // Aggregate kas per bulan untuk chart
  const monthlyMap = new Map<string, { masuk: number; keluar: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { masuk: 0, keluar: 0 });
  }

  for (const k of kasMonthly) {
    const d = new Date(k.tanggal);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key);
    if (existing) {
      if (k.jenis === "MASUK") existing.masuk += k.jumlah;
      else existing.keluar += k.jumlah;
    }
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const chartData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => {
      const [y, m] = key.split("-");
      return {
        month: `${monthNames[Number(m) - 1]} ${y.slice(2)}`,
        masuk: val.masuk,
        keluar: val.keluar,
      };
    });

  // Data untuk wallet distribution chart
  const walletChartData = walletPos
    .filter((w) => w.saldoSaatIni > 0)
    .map((w) => ({
      nama: w.pos.nama,
      saldo: w.saldoSaatIni,
    }));

  return (
    <AppShell user={user || { email }} active="/dashboard">
      <div className="page-header mb-5">
        <h2>Dashboard Overview</h2>
        <p>Ringkasan kondisi keuangan dan portofolio investasi Anda.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card label="Total Saldo Wallet" value={formatRupiah(totalSaldoWallet)} isCurrency valueNumber={totalSaldoWallet} />
        <Card label="Total Kas" value={formatRupiah(totalKas._sum.jumlah || 0)} isCurrency valueNumber={totalKas._sum.jumlah || 0} />
        <Card label="Transaksi Investasi" value={String(totalInvestasi)} />
        <Card label="Zakat Belum Dibayar" value={formatRupiah(totalSisaZakat)} isCurrency valueNumber={totalSisaZakat} isZakat />
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <KasTrendChart data={chartData} />
        <WalletDistributionChart data={walletChartData} />
      </div>

      {/* Zakat 2.5% Widget */}
      <section className="mt-6 card">
        <div className="flex justify-between items-center mb-3">
          <div className="section-title !mb-0 text-[var(--accent-red)]">Kewajiban Zakat 2.5%</div>
          <Link href="/zakat" className="text-[0.75rem] font-medium hover:underline text-[var(--text-primary)]">
            Lihat Zakat →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Murobahah */}
          <Link href="/zakat?sumber=MUROBAHAH"
            className="flex flex-col rounded-lg p-3 transition-colors hover:border-[var(--accent-gold)]"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
            <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1 uppercase">Murobahah</div>
            <div className="text-[1.1rem] font-bold" style={{ color: sisaMurobahah > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>
              {formatRupiah(sisaMurobahah)}
            </div>
            <div className="text-[0.7rem] text-[var(--text-muted)] mt-1">
              {zakatMurobahahItems.length} kewajiban belum lunas
            </div>
          </Link>

          {/* Deviden / Investasi Teman */}
          <Link href="/zakat?sumber=DEVIDEN"
            className="flex flex-col rounded-lg p-3 transition-colors hover:border-[var(--accent-gold)]"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
            <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1 uppercase">Deviden (Investasi Teman)</div>
            <div className="text-[1.1rem] font-bold" style={{ color: sisaDeviden > 0 ? "var(--accent-red)" : "var(--accent-green)" }}>
              {formatRupiah(sisaDeviden)}
            </div>
            <div className="text-[0.7rem] text-[var(--text-muted)] mt-1">
              {zakatDevidenItems.length} kewajiban belum lunas
            </div>
          </Link>
        </div>
      </section>

      <section className="mt-6 card">
        <div className="flex items-center justify-between mb-3">
          <div className="section-title !mb-0">Wallet Pos Alokasi</div>
          <ResetWalletButton totalSaldo={totalSaldoWallet} />
        </div>
        {walletPos.length === 0 ? (
          <p className="text-[0.8rem]" style={{ color: "var(--text-secondary)" }}>Belum ada wallet pos. Setup template alokasi terlebih dahulu.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {walletPos.map((w) => (
              <div
                key={w.id}
                className="flex flex-col justify-between rounded-lg p-3 transition-colors hover:border-[var(--text-muted)]"
                style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <div className="text-[0.8rem] font-medium" style={{ color: "var(--text-primary)" }}>{w.pos.nama}</div>
                    <div className="text-[0.7rem] mt-0.5" style={{ color: "var(--text-secondary)" }}>{w.pos.persentase}% alokasi</div>
                  </div>
                </div>
                <div className="mt-1.5">
                  <div className="text-[1rem] font-bold" style={{ color: w.saldoSaatIni >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {formatRupiah(w.saldoSaatIni)}
                  </div>
                  <div className="text-[0.65rem] mt-1 flex justify-between" style={{ color: "var(--text-muted)" }}>
                    <span>In: {formatRupiah(w.totalMasuk)}</span>
                    <span>Out: {formatRupiah(w.totalKeluar)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Card({
  label,
  value,
  isCurrency,
  valueNumber,
  isZakat
}: {
  label: string;
  value: string;
  isCurrency?: boolean;
  valueNumber?: number;
  isZakat?: boolean;
}) {
  let valueColor = "var(--text-primary)";
  if (isCurrency && valueNumber !== undefined) {
    if (isZakat && valueNumber > 0) valueColor = "var(--accent-red)";
    else if (valueNumber > 0) valueColor = "var(--accent-green)";
    else if (valueNumber < 0) valueColor = "var(--accent-red)";
  }

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: valueColor }}>{value}</div>
    </div>
  );
}
