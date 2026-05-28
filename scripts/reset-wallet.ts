import { db } from "../lib/db";

async function main() {
  const wallets = await db.walletPos.findMany({
    where: { saldoSaatIni: { gt: 0 } },
    include: { pos: true }
  });

  console.log(`Ditemukan ${wallets.length} pos wallet dengan saldo > 0. Sedang mereset...`);

  for (const w of wallets) {
    await db.$transaction(async (tx) => {
      // Catat penarikan
      await tx.penarikan.create({
        data: {
          userId: w.userId,
          walletPosId: w.id,
          nominal: w.saldoSaatIni,
          tanggal: new Date(),
          keterangan: "Tarik semua saldo (mulai dari 0 lagi)",
          akun: "Kas/Bank",
        },
      });

      // Update saldo jadi 0
      await tx.walletPos.update({
        where: { id: w.id },
        data: {
          saldoSaatIni: 0,
          totalKeluar: w.totalKeluar + w.saldoSaatIni,
        },
      });
    });
    console.log(`✅ Berhasil menarik Rp ${w.saldoSaatIni.toLocaleString()} dari pos "${w.pos.nama}"`);
  }
  
  console.log("Reset selesai!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });