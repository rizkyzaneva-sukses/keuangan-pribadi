import { db } from '../lib/db';

async function main() {
  // 1. Move CBU TANGERANG to Murobahah
  const cbu = await db.investasi.findUnique({
    where: { id: 2 },
    include: { transaksi: true }
  });
  
  if (cbu) {
    console.log("Migrating CBU TANGERANG...");
    const pokok = cbu.transaksi.find(t => t.kategori === 'OUT_BUSINESS_CAPITAL')?.principal || 52913000;
    const profitTx = cbu.transaksi.find(t => t.kategori === 'IN_CAPITAL_RETURN_PLUS_PROFIT');
    const totalImbalHasil = profitTx?.profit || 5287000;
    const tanggalMulai = cbu.transaksi.find(t => t.kategori === 'OUT_BUSINESS_CAPITAL')?.tanggal || new Date('2025-10-10');
    const jatuhTempo = profitTx?.tanggal || new Date('2026-01-11');

    const murobahah = await db.murobahah.create({
      data: {
        userId: cbu.userId,
        namaPartner: 'CBU Tangerang',
        pokok,
        totalImbalHasil,
        tanggalMulai,
        jatuhTempo,
        status: 'LUNAS',
        catatan: cbu.catatan,
      }
    });

    if (profitTx && profitTx.profit > 0) {
      await db.imbalHasilDiterima.create({
        data: {
          userId: cbu.userId,
          murobahahId: murobahah.id,
          tanggal: profitTx.tanggal,
          jumlah: profitTx.profit,
        }
      });
    }

    await db.investasi.delete({ where: { id: 2 } });
    console.log("CBU TANGERANG migrated successfully!");
  }

  // 2. Move KMP (Cimol Bojot) to InvestasiTeman
  const kmp = await db.investasi.findUnique({
    where: { id: 1 },
    include: { transaksi: { orderBy: { tanggal: 'asc' } } }
  });

  if (kmp) {
    console.log("Migrating KMP (Cimol Bojot)...");
    const outTx = kmp.transaksi.filter(t => t.arah === 'OUT');
    const modal = outTx.reduce((sum, t) => sum + t.principal, 0) || 251000000;
    const tanggalMulai = kmp.transaksi[0]?.tanggal || new Date('2025-06-16');

    const invTemanKMP = await db.investasiTeman.create({
      data: {
        userId: kmp.userId,
        namaTeman: 'KMP (Cimol Bojot)',
        modal,
        tanggalMulai,
        status: 'AKTIF',
        catatan: kmp.catatan,
      }
    });

    const inTx = kmp.transaksi.filter(t => t.kategori === 'IN_DIVIDEND' && t.profit > 0);
    for (const tx of inTx) {
      await db.deviden.create({
        data: {
          userId: kmp.userId,
          investasiTemanId: invTemanKMP.id,
          tanggal: tx.tanggal,
          jumlah: tx.profit,
        }
      });
    }

    await db.investasi.delete({ where: { id: 1 } });
    console.log("KMP migrated successfully!");
  }

  // 3. Move Synergy Manufacture to InvestasiTeman
  const synergy = await db.investasi.findUnique({
    where: { id: 4 },
    include: { transaksi: { orderBy: { tanggal: 'asc' } } }
  });

  if (synergy) {
    console.log("Migrating Synergy Manufacture...");
    const outTx = synergy.transaksi.filter(t => t.arah === 'OUT');
    const modal = outTx.reduce((sum, t) => sum + t.principal, 0) || 45000000;
    const tanggalMulai = synergy.transaksi[0]?.tanggal || new Date('2025-10-18');

    const invTemanSynergy = await db.investasiTeman.create({
      data: {
        userId: synergy.userId,
        namaTeman: 'Synergy Manufacture',
        modal,
        tanggalMulai,
        status: 'AKTIF',
        catatan: synergy.catatan,
      }
    });

    const inTx = synergy.transaksi.filter(t => t.kategori === 'IN_DIVIDEND' && t.profit > 0);
    for (const tx of inTx) {
      await db.deviden.create({
        data: {
          userId: synergy.userId,
          investasiTemanId: invTemanSynergy.id,
          tanggal: tx.tanggal,
          jumlah: tx.profit,
        }
      });
    }

    await db.investasi.delete({ where: { id: 4 } });
    console.log("Synergy migrated successfully!");
  }
}

main().catch(console.error).finally(() => process.exit(0));
