import { db } from '../lib/db';

async function main() {
  console.log("Mencari deviden tanpa zakat...");
  const devidens = await db.deviden.findMany({
    where: { zakat: { none: {} } },
    include: { investasiTeman: true }
  });

  for (const dev of devidens) {
    const zakatJumlah = Math.round(dev.jumlah * 0.025);
    const zakat = await db.zakat.create({
      data: {
        userId: dev.userId,
        sumber: "DEVIDEN",
        tahun: dev.tanggal.getFullYear(),
        jumlah: zakatJumlah,
        sudahDibayar: zakatJumlah,
        status: "SUDAH",
        tanggalWajib: dev.tanggal,
        tanggalBayar: new Date(),
        devidenId: dev.id,
        catatan: `Auto-generated zakat 2.5% dari deviden ${dev.investasiTeman.namaTeman} (Dilunasi otomatis)`,
      }
    });
    
    await db.pembayaranZakat.create({
      data: {
        zakatId: zakat.id,
        userId: dev.userId,
        tanggal: new Date(),
        jumlah: zakatJumlah,
        keterangan: "Pembayaran lunas (migrasi)",
      }
    });
    console.log(`Zakat lunas dibuat untuk deviden ID ${dev.id}`);
  }

  console.log("Mencari imbal hasil tanpa zakat...");
  const imbalHasil = await db.imbalHasilDiterima.findMany({
    where: { zakat: { none: {} } },
    include: { murobahah: true }
  });

  for (const imbal of imbalHasil) {
    const zakatJumlah = Math.round(imbal.jumlah * 0.025);
    const zakat = await db.zakat.create({
      data: {
        userId: imbal.userId,
        sumber: "MUROBAHAH",
        tahun: imbal.tanggal.getFullYear(),
        jumlah: zakatJumlah,
        sudahDibayar: zakatJumlah,
        status: "SUDAH",
        tanggalWajib: imbal.tanggal,
        tanggalBayar: new Date(),
        imbalHasilDiterimaId: imbal.id,
        catatan: `Auto-generated zakat 2.5% dari murobahah ${imbal.murobahah.namaPartner} (Dilunasi otomatis)`,
      }
    });

    await db.pembayaranZakat.create({
      data: {
        zakatId: zakat.id,
        userId: imbal.userId,
        tanggal: new Date(),
        jumlah: zakatJumlah,
        keterangan: "Pembayaran lunas (migrasi)",
      }
    });
    console.log(`Zakat lunas dibuat untuk imbal hasil ID ${imbal.id}`);
  }

  console.log("Selesai!");
}

main().catch(console.error).finally(() => process.exit(0));
