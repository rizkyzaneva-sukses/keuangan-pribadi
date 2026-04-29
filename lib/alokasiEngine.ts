import { KategoriTransaksiInvestasi, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const TRIGGER: KategoriTransaksiInvestasi[] = [
  "IN_DIVIDEND",
  "IN_CAPITAL_RETURN_PLUS_PROFIT",
  "IN_OTHER",
];

export async function runAlokasi(trxId: number) {
  const trx = await db.trxInvestasi.findUnique({
    where: { id: trxId },
    include: { investasi: true },
  });

  if (!trx) return;
  if (!TRIGGER.includes(trx.kategori)) return;
  if (trx.profit <= 0) return;

  // Cari template yang diassign ke investasi ini, atau pakai default
  const assignment = await db.templateAssignment.findUnique({
    where: { investasiId: trx.investasiId },
    include: {
      template: { include: { pos: { orderBy: { urutan: "asc" } } } },
    },
  });

  let template = assignment?.template;

  if (!template) {
    template = await db.templateAlokasi.findFirst({
      where: { userId: trx.userId, isDefault: true },
      include: { pos: { orderBy: { urutan: "asc" } } },
    });
  }

  if (!template || template.pos.length === 0) return;

  // Cek apakah ada override persentase untuk investasi ini
  const overrides = await db.templateOverride.findMany({
    where: { investasiId: trx.investasiId },
  });

  // Bangun mapping posId -> persentase (override menimpa default template)
  const overrideMap = new Map(overrides.map((o) => [o.posId, o.persentase]));

  // Pakai persentase override jika ada, jika tidak pakai dari template
  const posWithPersen = template.pos.map((p) => ({
    ...p,
    persentase: overrideMap.has(p.id) ? overrideMap.get(p.id)! : p.persentase,
  }));

  const totalPersen = posWithPersen.reduce((s, p) => s + p.persentase, 0);
  if (totalPersen === 0) return;

  const nominals = posWithPersen.map((p) =>
    Math.floor((trx.profit * p.persentase) / 100)
  );
  const allocated = nominals.reduce((s, n) => s + n, 0);
  const sisa = trx.profit - allocated;

  // Sisa (karena pembulatan) ditambahkan ke pos pertama yang punya %
  if (sisa > 0) {
    const firstEligibleIndex = posWithPersen.findIndex((p) => p.persentase > 0);
    if (firstEligibleIndex >= 0) nominals[firstEligibleIndex] += sisa;
  }

  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    for (let i = 0; i < posWithPersen.length; i++) {
      const pos = posWithPersen[i];
      const nominal = nominals[i];

      if (nominal <= 0) continue;

      let wallet = await tx.walletPos.findUnique({ where: { posId: pos.id } });
      if (!wallet) {
        wallet = await tx.walletPos.create({
          data: {
            userId: trx.userId,
            posId: pos.id,
            saldoSaatIni: 0,
            totalMasuk: 0,
            totalKeluar: 0,
          },
        });
      }

      await tx.walletPos.update({
        where: { id: wallet.id },
        data: {
          saldoSaatIni: { increment: nominal },
          totalMasuk: { increment: nominal },
        },
      });

      await tx.alokasiLog.create({
        data: {
          trxId: trx.id,
          posId: pos.id,
          templateId: template.id,
          nominal,
        },
      });
    }

    await tx.trxInvestasi.update({
      where: { id: trx.id },
      data: { sudahDialokasikan: true },
    });
  });
}
