import { db } from "@/lib/db";
import { runAlokasiImbalHasil } from "@/lib/alokasiEngine";

export async function getMurobahahReceiptSummary(
  murobahahId: number,
  excludeReceiptId?: number
) {
  const receipts = await db.imbalHasilDiterima.findMany({
    where: {
      murobahahId,
      ...(excludeReceiptId ? { id: { not: excludeReceiptId } } : {}),
    },
    select: {
      jumlah: true,
      pokokDiterima: true,
    },
  });

  return receipts.reduce(
    (acc, receipt) => {
      acc.totalImbalDiterima += receipt.jumlah;
      acc.totalPokokDiterima += receipt.pokokDiterima;
      return acc;
    },
    { totalImbalDiterima: 0, totalPokokDiterima: 0 }
  );
}

export async function repairMurobahahReceipts(murobahahId: number) {
  const murobahah = await db.murobahah.findUnique({
    where: { id: murobahahId },
    include: {
      imbalHasilDiterima: {
        orderBy: [{ tanggal: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!murobahah) return;

  let remainingImbal = murobahah.totalImbalHasil;
  const nextValues = murobahah.imbalHasilDiterima.map((receipt) => {
    const totalPenerimaan = receipt.pokokDiterima + receipt.jumlah;
    const imbalBaru = Math.min(totalPenerimaan, Math.max(remainingImbal, 0));
    const pokokBaru = totalPenerimaan - imbalBaru;
    remainingImbal -= imbalBaru;

    return {
      id: receipt.id,
      jumlah: imbalBaru,
      pokokDiterima: pokokBaru,
    };
  });

  await db.$transaction(async (tx) => {
    for (const receipt of nextValues) {
      const zakatRows = await tx.zakat.findMany({
        where: { imbalHasilDiterimaId: receipt.id },
        include: { pembayaran: true },
        orderBy: { id: "asc" },
      });

      const hasPaidZakat = zakatRows.some(
        (zakat) => zakat.sudahDibayar > 0 || zakat.pembayaran.length > 0
      );
      if (hasPaidZakat) {
        throw new Error("Tidak bisa merepair murobahah yang zakatnya sudah dibayar.");
      }

      const allocationLogs = await tx.alokasiLog.findMany({
        where: { imbalHasilDiterimaId: receipt.id },
      });

      for (const log of allocationLogs) {
        await tx.walletPos.update({
          where: { posId: log.posId },
          data: {
            saldoSaatIni: { decrement: log.nominal },
            totalMasuk: { decrement: log.nominal },
          },
        });
      }

      await tx.alokasiLog.deleteMany({
        where: { imbalHasilDiterimaId: receipt.id },
      });

      if (receipt.jumlah > 0) {
        if (zakatRows.length === 0) {
          await tx.zakat.create({
            data: {
              userId: murobahah.userId,
              sumber: "MUROBAHAH",
              tahun: new Date(
                murobahah.imbalHasilDiterima.find((item) => item.id === receipt.id)?.tanggal ??
                  new Date()
              ).getFullYear(),
              jumlah: Math.round(receipt.jumlah * 0.025),
              tanggalWajib:
                murobahah.imbalHasilDiterima.find((item) => item.id === receipt.id)?.tanggal ??
                new Date(),
              imbalHasilDiterimaId: receipt.id,
              catatan: `Auto-generated zakat 2.5% dari imbal hasil ${murobahah.namaPartner}`,
            },
          });
        } else {
          await tx.zakat.update({
            where: { id: zakatRows[0].id },
            data: {
              jumlah: Math.round(receipt.jumlah * 0.025),
            },
          });
          if (zakatRows.length > 1) {
            await tx.zakat.deleteMany({
              where: { id: { in: zakatRows.slice(1).map((item) => item.id) } },
            });
          }
        }
      } else {
        await tx.zakat.deleteMany({
          where: { id: { in: zakatRows.map((item) => item.id) } },
        });
      }

      await tx.imbalHasilDiterima.update({
        where: { id: receipt.id },
        data: {
          jumlah: receipt.jumlah,
          pokokDiterima: receipt.pokokDiterima,
          sudahDialokasikan: false,
        },
      });
    }
  });

  for (const receipt of nextValues) {
    if (receipt.jumlah > 0) {
      await runAlokasiImbalHasil(receipt.id);
    }
  }
}
