import { KategoriTransaksiInvestasi, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const TRIGGER: KategoriTransaksiInvestasi[] = [
  "IN_DIVIDEND",
  "IN_CAPITAL_RETURN_PLUS_PROFIT",
  "IN_OTHER",
];

export async function syncAlokasiInvestasi(investasiId: number) {
  const txs = await db.trxInvestasi.findMany({
    where: {
      investasiId,
      sudahDialokasikan: false,
      arah: "IN",
      kategori: { in: TRIGGER },
      profit: { gt: 0 },
    },
    orderBy: [{ tanggal: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  for (const trx of txs) {
    await runAlokasi(trx.id);
  }
}

type TemplatePos = {
  id: number;
  nama: string;
  persentase: number;
  urutan: number;
};

async function resolveTemplate(userId: number, templateId: number | null) {
  if (templateId) {
    const template = await db.templateAlokasi.findFirst({
      where: { id: templateId, userId },
      include: { pos: { orderBy: { urutan: "asc" } } },
    });
    if (template && template.pos.length > 0) return template;
  }

  return db.templateAlokasi.findFirst({
    where: { userId, isDefault: true },
    include: { pos: { orderBy: { urutan: "asc" } } },
  });
}

async function allocateToTemplate(args: {
  userId: number;
  amount: number;
  templateId: number | null;
  positions?: TemplatePos[];
  posOverrideKey?: "trxId" | "devidenId" | "imbalHasilDiterimaId";
  sourceId: number;
}) {
  const template = args.positions
    ? (await resolveTemplate(args.userId, args.templateId))
    : await resolveTemplate(args.userId, args.templateId);
  if (!template || template.pos.length === 0) return false;

  const posWithPersen = (args.positions ?? template.pos) as TemplatePos[];

  const totalPersen = posWithPersen.reduce((s, p) => s + p.persentase, 0);
  if (totalPersen === 0) return false;

  const nominals = posWithPersen.map((p) => Math.floor((args.amount * p.persentase) / 100));
  const allocated = nominals.reduce((s, n) => s + n, 0);
  const sisa = args.amount - allocated;

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
            userId: args.userId,
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
          ...(args.posOverrideKey === "trxId" ? { trxId: args.sourceId } : {}),
          ...(args.posOverrideKey === "devidenId" ? { devidenId: args.sourceId } : {}),
          ...(args.posOverrideKey === "imbalHasilDiterimaId" ? { imbalHasilDiterimaId: args.sourceId } : {}),
          posId: pos.id,
          templateId: template.id,
          nominal,
        },
      });
    }
  });

  return true;
}

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

  let template = assignment?.template || null;

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

  const amount = trx.profit;
  const totalPersen = posWithPersen.reduce((s, p) => s + p.persentase, 0);
  if (totalPersen === 0) return;

  const allocated = await allocateToTemplate({
    userId: trx.userId,
    amount,
    templateId: template.id,
    positions: posWithPersen,
    posOverrideKey: "trxId",
    sourceId: trx.id,
  });
  if (!allocated) return;

  await db.trxInvestasi.update({
    where: { id: trx.id },
    data: { sudahDialokasikan: true },
  });
}

export async function syncAlokasiTeman(investasiTemanId: number) {
  const deviden = await db.deviden.findMany({
    where: {
      investasiTemanId,
      sudahDialokasikan: false,
      jumlah: { gt: 0 },
    },
    orderBy: [{ tanggal: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  for (const item of deviden) {
    await runAlokasiDeviden(item.id);
  }
}

export async function runAlokasiDeviden(devidenId: number) {
  const deviden = await db.deviden.findUnique({
    where: { id: devidenId },
    include: { investasiTeman: true },
  });

  if (!deviden) return;
  if (deviden.jumlah <= 0) return;

  const zakatDeduction = Math.round(deviden.jumlah * 0.025);
  const amountToAllocate = deviden.jumlah - zakatDeduction;

  const allocated = await allocateToTemplate({
    userId: deviden.userId,
    amount: amountToAllocate,
    templateId: deviden.templateId ?? deviden.investasiTeman.templateId,
    posOverrideKey: "devidenId",
    sourceId: deviden.id,
  });

  if (!allocated) return;

  await db.deviden.update({
    where: { id: deviden.id },
    data: { sudahDialokasikan: true },
  });
}

export async function syncAlokasiMurobahah(murobahahId: number) {
  const items = await db.imbalHasilDiterima.findMany({
    where: {
      murobahahId,
      sudahDialokasikan: false,
      jumlah: { gt: 0 },
    },
    orderBy: [{ tanggal: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  for (const item of items) {
    await runAlokasiImbalHasil(item.id);
  }
}

export async function runAlokasiImbalHasil(imbalHasilDiterimaId: number) {
  const imbal = await db.imbalHasilDiterima.findUnique({
    where: { id: imbalHasilDiterimaId },
    include: { murobahah: true },
  });

  if (!imbal) return;
  if (imbal.jumlah <= 0) return;

  const zakatDeduction = Math.round(imbal.jumlah * 0.025);
  const amountToAllocate = imbal.jumlah - zakatDeduction;

  const allocated = await allocateToTemplate({
    userId: imbal.userId,
    amount: amountToAllocate,
    templateId: imbal.templateId ?? imbal.murobahah.templateId,
    posOverrideKey: "imbalHasilDiterimaId",
    sourceId: imbal.id,
  });

  if (!allocated) return;

  await db.imbalHasilDiterima.update({
    where: { id: imbal.id },
    data: { sudahDialokasikan: true },
  });
}
