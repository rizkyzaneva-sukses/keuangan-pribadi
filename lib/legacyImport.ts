import { addMonths } from "date-fns";
import type {
  ArahTransaksiInvestasi,
  KategoriTransaksiInvestasi,
} from "@prisma/client";
import { db } from "@/lib/db";
import type {
  LegacyArbitraryRecord,
  LegacyBackup,
  LegacyInvestment,
  LegacyInvestmentMapping,
  LegacyTransaction,
  LegacyWallet,
  LegacyWalletWithdrawal,
} from "@/lib/legacyBackup";

type ImportSummary = {
  created: Record<string, number>;
  skipped: Record<string, number>;
  archived: Record<string, number>;
  warnings: string[];
};

type ImportResult = {
  summary: ImportSummary;
};

type LegacyImportRow = Awaited<
  ReturnType<typeof db.legacyImportItem.findMany>
>[number];

type LegacyAllocationEntry = {
  pos_id?: string;
  label?: string;
  pct?: number;
  amount?: number;
};

type ImportedTemplateInfo = {
  legacyId: string;
  templateId: number;
  isDefault: boolean;
  investmentLegacyId: string | null;
  name: string;
  positionsByLegacyPosId: Map<string, { posId: number; label: string }>;
  positionsByLabel: Map<string, { posId: number; label: string }>;
};

type CreateLegacyImportInput = {
  userId: number;
  section: string;
  legacyId: string;
  targetType?: string | null;
  targetId?: number | null;
  title?: string | null;
  subtitle?: string | null;
  payload: unknown;
  legacyCreatedAt?: Date | null;
  legacyUpdatedAt?: Date | null;
};

type SectionKey = keyof ImportSummary["created"];

const SECTION_KEYS: SectionKey[] = [
  "templates",
  "wallets",
  "withdrawals",
  "investasi",
  "trxInvestasi",
  "teman",
  "deviden",
  "murobahah",
  "imbalHasil",
  "zakat",
  "arsip",
];

function createSummary(): ImportSummary {
  const created = Object.fromEntries(SECTION_KEYS.map((key) => [key, 0])) as Record<
    SectionKey,
    number
  >;
  const skipped = Object.fromEntries(SECTION_KEYS.map((key) => [key, 0])) as Record<
    SectionKey,
    number
  >;
  const archived = Object.fromEntries(SECTION_KEYS.map((key) => [key, 0])) as Record<
    SectionKey,
    number
  >;

  return { created, skipped, archived, warnings: [] };
}

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: unknown) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function parseAllocations(raw: string | null | undefined) {
  if (!raw) return [] as LegacyAllocationEntry[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LegacyAllocationEntry[]) : [];
  } catch {
    return [];
  }
}

function normalizeLabel(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function buildInvestasiCatatan(investment: LegacyInvestment) {
  const parts = [];

  if (investment.notes?.trim()) {
    parts.push(investment.notes.trim());
  }

  if (investment.start_date) {
    parts.push(`Legacy mulai: ${investment.start_date}`);
  }

  if (investment.closed_date) {
    parts.push(`Legacy selesai: ${investment.closed_date}`);
  }

  return parts.join("\n");
}

function getLegacyTemplateForInvestment(
  templates: ImportedTemplateInfo[],
  legacyInvestmentId: string,
) {
  return (
    templates.find((template) => template.investmentLegacyId === legacyInvestmentId) ??
    null
  );
}

function getDefaultTemplate(templates: ImportedTemplateInfo[]) {
  return templates.find((template) => template.isDefault) ?? templates[0] ?? null;
}

function resolveInvestasiStatus(investment: LegacyInvestment) {
  if (investment.archived) return "ARCHIVED" as const;
  if (investment.status === "CLOSED") return "CLOSED" as const;
  return "ACTIVE" as const;
}

function resolveTemanStatus(investment: LegacyInvestment) {
  return investment.archived || investment.status === "CLOSED" ? "SELESAI" : "AKTIF";
}

function resolveMurobahahStatus(investment: LegacyInvestment) {
  return investment.archived || investment.status === "CLOSED" ? "LUNAS" : "AKTIF";
}

function resolveArah(direction: string | null | undefined): ArahTransaksiInvestasi {
  return direction === "OUT" ? "OUT" : "IN";
}

function resolveKategori(
  category: string | null | undefined,
  direction: "IN" | "OUT",
): KategoriTransaksiInvestasi {
  const validIn = new Set([
    "IN_DIVIDEND",
    "IN_CAPITAL_RETURN",
    "IN_CAPITAL_RETURN_PLUS_PROFIT",
    "IN_OTHER",
  ]);
  const validOut = new Set(["OUT_BUSINESS_CAPITAL", "OUT_TOPUP_CAPITAL", "OUT_OTHER"]);

  if (direction === "IN") {
    return validIn.has(category ?? "")
      ? (category as KategoriTransaksiInvestasi)
      : "IN_OTHER";
  }

  return validOut.has(category ?? "")
    ? (category as KategoriTransaksiInvestasi)
    : "OUT_OTHER";
}

function makeLookup(items: LegacyImportRow[]) {
  return new Map(items.map((item) => [`${item.section}:${item.legacyId}`, item]));
}

function makeLegacyId(...parts: Array<string | number | null | undefined>) {
  return parts
    .filter((part) => part !== null && part !== undefined && String(part).length > 0)
    .join(":");
}

async function createLegacyImportRecord(
  lookup: Map<string, LegacyImportRow>,
  input: CreateLegacyImportInput,
) {
  const key = `${input.section}:${input.legacyId}`;
  const existing = lookup.get(key);
  if (existing) return existing;

  const created = await db.legacyImportItem.create({
    data: {
      userId: input.userId,
      section: input.section,
      legacyId: input.legacyId,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      title: input.title ?? null,
      subtitle: input.subtitle ?? null,
      payloadJson: JSON.stringify(input.payload),
      legacyCreatedAt: input.legacyCreatedAt ?? null,
      legacyUpdatedAt: input.legacyUpdatedAt ?? null,
    },
  });

  lookup.set(key, created);
  return created;
}

async function ensureWallet(userId: number, posId: number) {
  return db.walletPos.upsert({
    where: { posId },
    update: {},
    create: { userId, posId },
  });
}

async function createAllocationLogs(params: {
  userId: number;
  legacyIdPrefix: string;
  lookup: Map<string, LegacyImportRow>;
  template: ImportedTemplateInfo | null;
  source:
    | { type: "trx"; id: number }
    | { type: "deviden"; id: number }
    | { type: "imbal"; id: number };
  rawAllocationLog: string | null | undefined;
  summary: ImportSummary;
}) {
  const entries = parseAllocations(params.rawAllocationLog);
  if (entries.length === 0) return 0;

  let createdCount = 0;

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const amount = toNumber(entry.amount);
    if (amount <= 0) continue;

    let position =
      (entry.pos_id ? params.template?.positionsByLegacyPosId.get(entry.pos_id) : undefined) ??
      params.template?.positionsByLabel.get(normalizeLabel(entry.label));

    if (!position && params.template) {
      position =
        Array.from(params.template.positionsByLegacyPosId.values())[index] ??
        Array.from(params.template.positionsByLabel.values())[index];
    }

    if (!position || !params.template) {
      params.summary.warnings.push(
        `Pos alokasi legacy tidak ditemukan untuk ${params.legacyIdPrefix} (${entry.label ?? entry.pos_id ?? "tanpa-label"}).`,
      );
      continue;
    }

    const legacyId = makeLegacyId(params.legacyIdPrefix, entry.pos_id ?? entry.label ?? index);
    const existing = params.lookup.get(`allocation_logs:${legacyId}`);
    if (existing) {
      continue;
    }

    await ensureWallet(params.userId, position.posId);

    await db.alokasiLog.create({
      data: {
        ...(params.source.type === "trx" ? { trxId: params.source.id } : {}),
        ...(params.source.type === "deviden" ? { devidenId: params.source.id } : {}),
        ...(params.source.type === "imbal"
          ? { imbalHasilDiterimaId: params.source.id }
          : {}),
        posId: position.posId,
        templateId: params.template.templateId,
        nominal: amount,
      },
    });

    await db.walletPos.update({
      where: { posId: position.posId },
      data: {
        saldoSaatIni: { increment: amount },
        totalMasuk: { increment: amount },
      },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "allocation_logs",
      legacyId,
      targetType: "ALOKASI_LOG",
      targetId: null,
      title: position.label,
      subtitle: params.legacyIdPrefix,
      payload: entry,
    });

    createdCount += 1;
  }

  return createdCount;
}

async function importTemplates(params: {
  userId: number;
  backup: LegacyBackup;
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const importedTemplates: ImportedTemplateInfo[] = [];
  const templates = params.backup.allocation_templates ?? [];

  for (const template of templates) {
    const legacyTemplateId = template.id;
    const existingRecord = params.lookup.get(`allocation_templates:${legacyTemplateId}`);
    if (existingRecord?.targetId) {
      const existingTemplate = await db.templateAlokasi.findUnique({
        where: { id: existingRecord.targetId },
        include: { pos: { orderBy: { urutan: "asc" } } },
      });

      if (existingTemplate) {
        importedTemplates.push({
          legacyId: legacyTemplateId,
          templateId: existingTemplate.id,
          isDefault: existingTemplate.isDefault,
          investmentLegacyId: template.investment_id ?? null,
          name: existingTemplate.nama,
          positionsByLegacyPosId: buildPositionLookup(params.lookup, legacyTemplateId, existingTemplate.pos),
          positionsByLabel: buildLabelLookup(existingTemplate.pos),
        });
        params.summary.skipped.templates += 1;
        continue;
      }
    }

    const allocations = parseAllocations(template.allocations);
    if (allocations.length === 0) {
      params.summary.warnings.push(`Template legacy "${template.name}" tidak punya alokasi valid.`);
      continue;
    }

    if (template.is_default) {
      await db.templateAlokasi.updateMany({
        where: { userId: params.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const createdTemplate = await db.templateAlokasi.create({
      data: {
        userId: params.userId,
        nama: template.name,
        catatan: template.effective_month
          ? `Import legacy • Effective month ${template.effective_month}`
          : "Import legacy",
        isDefault: Boolean(template.is_default),
        createdAt: toDate(template.created_date) ?? undefined,
        updatedAt: toDate(template.updated_date) ?? undefined,
        pos: {
          create: allocations.map((allocation, index) => ({
            nama: allocation.label?.trim() || `Pos ${index + 1}`,
            persentase: toNumber(allocation.pct),
            urutan: index + 1,
          })),
        },
      },
      include: { pos: { orderBy: { urutan: "asc" } } },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "allocation_templates",
      legacyId: legacyTemplateId,
      targetType: "TEMPLATE",
      targetId: createdTemplate.id,
      title: template.name,
      subtitle: template.investment_id ?? (template.is_default ? "default" : null),
      payload: template,
      legacyCreatedAt: toDate(template.created_date),
      legacyUpdatedAt: toDate(template.updated_date),
    });

    for (let index = 0; index < createdTemplate.pos.length; index += 1) {
      const position = createdTemplate.pos[index];
      const allocation = allocations[index];
      await ensureWallet(params.userId, position.id);
      await createLegacyImportRecord(params.lookup, {
        userId: params.userId,
        section: "template_positions",
        legacyId: makeLegacyId(legacyTemplateId, allocation.pos_id ?? index),
        targetType: "POS",
        targetId: position.id,
        title: position.nama,
        subtitle: template.name,
        payload: allocation,
      });
    }

    importedTemplates.push({
      legacyId: legacyTemplateId,
      templateId: createdTemplate.id,
      isDefault: createdTemplate.isDefault,
      investmentLegacyId: template.investment_id ?? null,
      name: createdTemplate.nama,
      positionsByLegacyPosId: buildPositionLookup(params.lookup, legacyTemplateId, createdTemplate.pos),
      positionsByLabel: buildLabelLookup(createdTemplate.pos),
    });

    params.summary.created.templates += 1;
  }

  return importedTemplates;
}

function buildPositionLookup(
  lookup: Map<string, LegacyImportRow>,
  legacyTemplateId: string,
  positions: { id: number; nama: string }[],
) {
  const map = new Map<string, { posId: number; label: string }>();

  for (const [key, item] of lookup.entries()) {
    if (!key.startsWith("template_positions:")) continue;
    const prefix = `template_positions:${legacyTemplateId}:`;
    if (!key.startsWith(prefix)) continue;
    const legacyPosId = item.legacyId.slice(`${legacyTemplateId}:`.length);
    const position = positions.find((candidate) => candidate.id === item.targetId);
    if (position && legacyPosId) {
      map.set(legacyPosId, { posId: position.id, label: position.nama });
    }
  }

  return map;
}

function buildLabelLookup(positions: { id: number; nama: string }[]) {
  const map = new Map<string, { posId: number; label: string }>();
  for (const position of positions) {
    map.set(normalizeLabel(position.nama), { posId: position.id, label: position.nama });
  }
  return map;
}

function buildTransactionsByInvestment(backup: LegacyBackup) {
  const map = new Map<string, LegacyTransaction[]>();

  for (const tx of backup.transactions ?? []) {
    const key = tx.investment_id ?? "";
    if (!key) continue;
    const items = map.get(key) ?? [];
    items.push(tx);
    map.set(key, items);
  }

  for (const [key, items] of map.entries()) {
    map.set(
      key,
      items.sort((a, b) => {
        const left = toDate(a.date)?.getTime() ?? 0;
        const right = toDate(b.date)?.getTime() ?? 0;
        return left - right;
      }),
    );
  }

  return map;
}

function getModalFromTransactions(transactions: LegacyTransaction[]) {
  return transactions
    .filter((tx) => tx.direction === "OUT")
    .reduce(
      (sum, tx) => sum + Math.max(toNumber(tx.principal_amount), toNumber(tx.total_amount)),
      0,
    );
}

function getPokokFromTransactions(transactions: LegacyTransaction[]) {
  return transactions
    .filter((tx) => tx.direction === "OUT")
    .reduce(
      (sum, tx) => sum + Math.max(toNumber(tx.principal_amount), toNumber(tx.total_amount)),
      0,
    );
}

function getTotalImbalFromTransactions(transactions: LegacyTransaction[]) {
  return transactions
    .filter((tx) => tx.direction === "IN")
    .reduce((sum, tx) => sum + toNumber(tx.profit_amount), 0);
}

async function archiveRawItem(params: {
  userId: number;
  section: string;
  legacyId: string;
  title?: string | null;
  subtitle?: string | null;
  payload: unknown;
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const existing = params.lookup.get(`${params.section}:${params.legacyId}`);
  if (existing) {
    params.summary.skipped.arsip += 1;
    return;
  }

  await createLegacyImportRecord(params.lookup, {
    userId: params.userId,
    section: params.section,
    legacyId: params.legacyId,
    targetType: "ARCHIVE_ONLY",
    targetId: null,
    title: params.title ?? null,
    subtitle: params.subtitle ?? null,
    payload: params.payload,
  });

  params.summary.archived.arsip += 1;
}

async function importLegacyInvestments(params: {
  userId: number;
  backup: LegacyBackup;
  mappings: LegacyInvestmentMapping[];
  templates: ImportedTemplateInfo[];
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const mappingLookup = new Map(
    params.mappings.map((mapping) => [mapping.legacyInvestmentId, mapping.target]),
  );
  const transactionsByInvestment = buildTransactionsByInvestment(params.backup);
  const defaultTemplate = getDefaultTemplate(params.templates);

  for (const investment of params.backup.investments ?? []) {
    const target = mappingLookup.get(investment.id) ?? "SKIP";
    const transactions = transactionsByInvestment.get(investment.id) ?? [];
    const scopedTemplate =
      getLegacyTemplateForInvestment(params.templates, investment.id) ?? defaultTemplate;

    if (target === "SKIP") {
      await archiveRawItem({
        userId: params.userId,
        section: "investments",
        legacyId: investment.id,
        title: investment.name,
        subtitle: "skip",
        payload: investment,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    if (target === "INVESTASI") {
      await importAsInvestasi({
        userId: params.userId,
        investment,
        transactions,
        template: scopedTemplate,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    if (target === "TEMAN") {
      await importAsTeman({
        userId: params.userId,
        investment,
        transactions,
        template: scopedTemplate,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    await importAsMurobahah({
      userId: params.userId,
      investment,
      transactions,
      template: scopedTemplate,
      lookup: params.lookup,
      summary: params.summary,
    });
  }
}

async function importAsInvestasi(params: {
  userId: number;
  investment: LegacyInvestment;
  transactions: LegacyTransaction[];
  template: ImportedTemplateInfo | null;
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const existing = params.lookup.get(`investments:${params.investment.id}`);
  let investasiId = existing?.targetId ?? null;

  if (!investasiId) {
    const created = await db.investasi.create({
      data: {
        userId: params.userId,
        nama: params.investment.name,
        partner: params.investment.partner?.trim() || null,
        tipe: "BISNIS",
        status: resolveInvestasiStatus(params.investment),
        catatan: buildInvestasiCatatan(params.investment) || null,
        createdAt: toDate(params.investment.created_date) ?? undefined,
        updatedAt: toDate(params.investment.updated_date) ?? undefined,
      },
    });

    investasiId = created.id;

    if (params.template) {
      await db.templateAssignment.upsert({
        where: { investasiId },
        update: { templateId: params.template.templateId },
        create: {
          investasiId,
          templateId: params.template.templateId,
        },
      });
    }

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "investments",
      legacyId: params.investment.id,
      targetType: "INVESTASI",
      targetId: investasiId,
      title: params.investment.name,
      subtitle: "portofolio",
      payload: params.investment,
      legacyCreatedAt: toDate(params.investment.created_date),
      legacyUpdatedAt: toDate(params.investment.updated_date),
    });

    params.summary.created.investasi += 1;
  } else {
    params.summary.skipped.investasi += 1;
  }

  for (const tx of params.transactions) {
    const existingTx = params.lookup.get(`transactions:${tx.id}`);
    if (existingTx) {
      params.summary.skipped.trxInvestasi += 1;
      continue;
    }

    const createdTx = await db.trxInvestasi.create({
      data: {
        userId: params.userId,
        investasiId,
        tanggal: toDate(tx.date) ?? new Date(),
        arah: resolveArah(tx.direction),
        kategori: resolveKategori(tx.category, resolveArah(tx.direction)),
        principal: toNumber(tx.principal_amount),
        profit: toNumber(tx.profit_amount),
        total: toNumber(tx.total_amount),
        metodeBayar: tx.payment_method?.trim() || null,
        akun: tx.account?.trim() || null,
        catatan: tx.note?.trim() || null,
        sudahDialokasikan: Boolean(tx.is_allocated) || parseAllocations(tx.allocation_log).length > 0,
        createdAt: toDate(tx.created_date) ?? undefined,
        updatedAt: toDate(tx.updated_date) ?? undefined,
      },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "transactions",
      legacyId: tx.id,
      targetType: "TRX_INVESTASI",
      targetId: createdTx.id,
      title: params.investment.name,
      subtitle: tx.category ?? tx.direction ?? null,
      payload: tx,
      legacyCreatedAt: toDate(tx.created_date),
      legacyUpdatedAt: toDate(tx.updated_date),
    });

    await createAllocationLogs({
      userId: params.userId,
      legacyIdPrefix: makeLegacyId("trx", tx.id),
      lookup: params.lookup,
      template: params.template,
      source: { type: "trx", id: createdTx.id },
      rawAllocationLog: tx.allocation_log,
      summary: params.summary,
    });

    params.summary.created.trxInvestasi += 1;
  }
}

async function importAsTeman(params: {
  userId: number;
  investment: LegacyInvestment;
  transactions: LegacyTransaction[];
  template: ImportedTemplateInfo | null;
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const existing = params.lookup.get(`investments:${params.investment.id}`);
  let investasiTemanId = existing?.targetId ?? null;

  if (!investasiTemanId) {
    const modal = getModalFromTransactions(params.transactions);
    const tanggalMulai =
      toDate(params.investment.start_date) ??
      toDate(params.transactions[0]?.date) ??
      toDate(params.investment.created_date) ??
      new Date();

    const created = await db.investasiTeman.create({
      data: {
        userId: params.userId,
        templateId: params.template?.templateId ?? null,
        namaTeman: params.investment.name,
        modal,
        tanggalMulai,
        status: resolveTemanStatus(params.investment),
        catatan: buildInvestasiCatatan(params.investment) || null,
        createdAt: toDate(params.investment.created_date) ?? undefined,
        updatedAt: toDate(params.investment.updated_date) ?? undefined,
      },
    });

    investasiTemanId = created.id;

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "investments",
      legacyId: params.investment.id,
      targetType: "INVESTASI_TEMAN",
      targetId: investasiTemanId,
      title: params.investment.name,
      subtitle: "teman",
      payload: params.investment,
      legacyCreatedAt: toDate(params.investment.created_date),
      legacyUpdatedAt: toDate(params.investment.updated_date),
    });

    params.summary.created.teman += 1;
  } else {
    params.summary.skipped.teman += 1;
  }

  for (const tx of params.transactions) {
    if (tx.direction !== "IN") {
      await archiveRawItem({
        userId: params.userId,
        section: "transactions",
        legacyId: tx.id,
        title: params.investment.name,
        subtitle: "modal-teman",
        payload: tx,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    const existingTx = params.lookup.get(`transactions:${tx.id}`);
    if (existingTx) {
      params.summary.skipped.deviden += 1;
      continue;
    }

    const jumlah = toNumber(tx.profit_amount || tx.total_amount);
    const createdDeviden = await db.deviden.create({
      data: {
        userId: params.userId,
        investasiTemanId,
        templateId: params.template?.templateId ?? null,
        tanggal: toDate(tx.date) ?? new Date(),
        jumlah,
        sudahDialokasikan: Boolean(tx.is_allocated) || parseAllocations(tx.allocation_log).length > 0,
        createdAt: toDate(tx.created_date) ?? undefined,
        updatedAt: toDate(tx.updated_date) ?? undefined,
      },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "transactions",
      legacyId: tx.id,
      targetType: "DEVIDEN",
      targetId: createdDeviden.id,
      title: params.investment.name,
      subtitle: "deviden",
      payload: tx,
      legacyCreatedAt: toDate(tx.created_date),
      legacyUpdatedAt: toDate(tx.updated_date),
    });

    await createAllocationLogs({
      userId: params.userId,
      legacyIdPrefix: makeLegacyId("deviden", tx.id),
      lookup: params.lookup,
      template: params.template,
      source: { type: "deviden", id: createdDeviden.id },
      rawAllocationLog: tx.allocation_log,
      summary: params.summary,
    });

    params.summary.created.deviden += 1;

    const zakatLegacyId = makeLegacyId("zakat", "deviden", tx.id);
    if (!params.lookup.get(`zakat:${zakatLegacyId}`) && jumlah > 0) {
      const createdZakat = await db.zakat.create({
        data: {
          userId: params.userId,
          sumber: "DEVIDEN",
          status: "BELUM",
          tahun: (toDate(tx.date) ?? new Date()).getFullYear(),
          jumlah: Math.round(jumlah * 0.025),
          sudahDibayar: 0,
          tanggalWajib: toDate(tx.date) ?? new Date(),
          devidenId: createdDeviden.id,
          catatan: `Import legacy zakat dari deviden ${params.investment.name}`,
        },
      });

      await createLegacyImportRecord(params.lookup, {
        userId: params.userId,
        section: "zakat",
        legacyId: zakatLegacyId,
        targetType: "ZAKAT",
        targetId: createdZakat.id,
        title: params.investment.name,
        subtitle: "deviden",
        payload: { transactionId: tx.id, amount: jumlah },
      });

      params.summary.created.zakat += 1;
    }
  }
}

async function importAsMurobahah(params: {
  userId: number;
  investment: LegacyInvestment;
  transactions: LegacyTransaction[];
  template: ImportedTemplateInfo | null;
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const existing = params.lookup.get(`investments:${params.investment.id}`);
  let murobahahId = existing?.targetId ?? null;

  if (!murobahahId) {
    const pokok = getPokokFromTransactions(params.transactions);
    const totalImbalHasil = getTotalImbalFromTransactions(params.transactions);
    const tanggalMulai =
      toDate(params.investment.start_date) ??
      toDate(params.transactions[0]?.date) ??
      toDate(params.investment.created_date) ??
      new Date();
    const jatuhTempo =
      toDate(params.investment.closed_date) ??
      (params.investment.tenor_months
        ? addMonths(tanggalMulai, params.investment.tenor_months)
        : null) ??
      toDate(params.transactions.at(-1)?.date) ??
      tanggalMulai;

    const created = await db.murobahah.create({
      data: {
        userId: params.userId,
        templateId: params.template?.templateId ?? null,
        namaPartner: params.investment.partner?.trim() || params.investment.name,
        pokok,
        totalImbalHasil,
        tanggalMulai,
        jatuhTempo,
        status: resolveMurobahahStatus(params.investment),
        catatan: buildInvestasiCatatan(params.investment) || null,
        createdAt: toDate(params.investment.created_date) ?? undefined,
        updatedAt: toDate(params.investment.updated_date) ?? undefined,
      },
    });

    murobahahId = created.id;

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "investments",
      legacyId: params.investment.id,
      targetType: "MUROBAHAH",
      targetId: murobahahId,
      title: params.investment.name,
      subtitle: "murobahah",
      payload: params.investment,
      legacyCreatedAt: toDate(params.investment.created_date),
      legacyUpdatedAt: toDate(params.investment.updated_date),
    });

    params.summary.created.murobahah += 1;
  } else {
    params.summary.skipped.murobahah += 1;
  }

  for (const tx of params.transactions) {
    if (tx.direction !== "IN") {
      await archiveRawItem({
        userId: params.userId,
        section: "transactions",
        legacyId: tx.id,
        title: params.investment.name,
        subtitle: "pokok-murobahah",
        payload: tx,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    const existingTx = params.lookup.get(`transactions:${tx.id}`);
    if (existingTx) {
      params.summary.skipped.imbalHasil += 1;
      continue;
    }

    const createdImbal = await db.imbalHasilDiterima.create({
      data: {
        userId: params.userId,
        murobahahId,
        templateId: params.template?.templateId ?? null,
        tanggal: toDate(tx.date) ?? new Date(),
        pokokDiterima: toNumber(tx.principal_amount),
        jumlah: toNumber(tx.profit_amount),
        sudahDialokasikan: Boolean(tx.is_allocated) || parseAllocations(tx.allocation_log).length > 0,
        createdAt: toDate(tx.created_date) ?? undefined,
        updatedAt: toDate(tx.updated_date) ?? undefined,
      },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "transactions",
      legacyId: tx.id,
      targetType: "IMBAL_HASIL",
      targetId: createdImbal.id,
      title: params.investment.name,
      subtitle: "imbal-hasil",
      payload: tx,
      legacyCreatedAt: toDate(tx.created_date),
      legacyUpdatedAt: toDate(tx.updated_date),
    });

    await createAllocationLogs({
      userId: params.userId,
      legacyIdPrefix: makeLegacyId("imbal", tx.id),
      lookup: params.lookup,
      template: params.template,
      source: { type: "imbal", id: createdImbal.id },
      rawAllocationLog: tx.allocation_log,
      summary: params.summary,
    });

    params.summary.created.imbalHasil += 1;

    const profit = toNumber(tx.profit_amount);
    const zakatLegacyId = makeLegacyId("zakat", "imbal", tx.id);
    if (!params.lookup.get(`zakat:${zakatLegacyId}`) && profit > 0) {
      const createdZakat = await db.zakat.create({
        data: {
          userId: params.userId,
          sumber: "MUROBAHAH",
          status: "BELUM",
          tahun: (toDate(tx.date) ?? new Date()).getFullYear(),
          jumlah: Math.round(profit * 0.025),
          sudahDibayar: 0,
          tanggalWajib: toDate(tx.date) ?? new Date(),
          imbalHasilDiterimaId: createdImbal.id,
          catatan: `Import legacy zakat dari imbal hasil ${params.investment.name}`,
        },
      });

      await createLegacyImportRecord(params.lookup, {
        userId: params.userId,
        section: "zakat",
        legacyId: zakatLegacyId,
        targetType: "ZAKAT",
        targetId: createdZakat.id,
        title: params.investment.name,
        subtitle: "murobahah",
        payload: { transactionId: tx.id, amount: profit },
      });

      params.summary.created.zakat += 1;
    }
  }
}

function resolveWalletPosition(
  templates: ImportedTemplateInfo[],
  wallet: LegacyWallet | LegacyWalletWithdrawal,
) {
  const legacyPosId = wallet.pos_id ?? null;
  const label = normalizeLabel(wallet.label);

  for (const template of templates) {
    if (legacyPosId && template.positionsByLegacyPosId.has(legacyPosId)) {
      return template.positionsByLegacyPosId.get(legacyPosId) ?? null;
    }
    if (label && template.positionsByLabel.has(label)) {
      return template.positionsByLabel.get(label) ?? null;
    }
  }

  return null;
}

async function importWalletSnapshots(params: {
  userId: number;
  backup: LegacyBackup;
  templates: ImportedTemplateInfo[];
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  for (const wallet of params.backup.allocation_wallets ?? []) {
    const existing = params.lookup.get(`allocation_wallets:${wallet.id}`);
    if (existing) {
      params.summary.skipped.wallets += 1;
      continue;
    }

    const position = resolveWalletPosition(params.templates, wallet);
    if (!position) {
      params.summary.warnings.push(
        `Wallet legacy "${wallet.label ?? wallet.pos_id ?? wallet.id}" tidak bisa dipetakan ke pos baru.`,
      );
      await archiveRawItem({
        userId: params.userId,
        section: "allocation_wallets",
        legacyId: wallet.id,
        title: wallet.label ?? wallet.pos_id ?? wallet.id,
        subtitle: "unmapped-wallet",
        payload: wallet,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    await db.walletPos.upsert({
      where: { posId: position.posId },
      update: {
        saldoSaatIni: toNumber(wallet.saldo),
        totalMasuk: toNumber(wallet.total_in_all),
        totalKeluar: toNumber(wallet.total_withdrawn),
      },
      create: {
        userId: params.userId,
        posId: position.posId,
        saldoSaatIni: toNumber(wallet.saldo),
        totalMasuk: toNumber(wallet.total_in_all),
        totalKeluar: toNumber(wallet.total_withdrawn),
      },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "allocation_wallets",
      legacyId: wallet.id,
      targetType: "WALLET",
      targetId: position.posId,
      title: wallet.label ?? position.label,
      subtitle: wallet.rekening ?? null,
      payload: wallet,
      legacyCreatedAt: toDate(wallet.created_date),
      legacyUpdatedAt: toDate(wallet.updated_date),
    });

    params.summary.created.wallets += 1;
  }
}

async function importWalletWithdrawals(params: {
  userId: number;
  backup: LegacyBackup;
  templates: ImportedTemplateInfo[];
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  for (const withdrawal of params.backup.wallet_withdrawals ?? []) {
    const existing = params.lookup.get(`wallet_withdrawals:${withdrawal.id}`);
    if (existing) {
      params.summary.skipped.withdrawals += 1;
      continue;
    }

    const position = resolveWalletPosition(params.templates, withdrawal);
    if (!position) {
      params.summary.warnings.push(
        `Penarikan legacy "${withdrawal.id}" tidak bisa dipetakan ke wallet pos baru.`,
      );
      await archiveRawItem({
        userId: params.userId,
        section: "wallet_withdrawals",
        legacyId: withdrawal.id,
        title: withdrawal.label ?? withdrawal.id,
        subtitle: "unmapped-withdrawal",
        payload: withdrawal,
        lookup: params.lookup,
        summary: params.summary,
      });
      continue;
    }

    const wallet = await ensureWallet(params.userId, position.posId);
    const nominal = toNumber(
      withdrawal.nominal ?? withdrawal.amount ?? withdrawal.jumlah,
    );
    const tanggal =
      toDate(withdrawal.tanggal ?? withdrawal.date) ??
      toDate(withdrawal.created_date) ??
      new Date();

    const created = await db.penarikan.create({
      data: {
        userId: params.userId,
        walletPosId: wallet.id,
        nominal,
        tanggal,
        akun:
          withdrawal.akun?.trim() ||
          withdrawal.account?.trim() ||
          withdrawal.rekening?.trim() ||
          null,
        keterangan:
          withdrawal.keterangan?.trim() ||
          withdrawal.note?.trim() ||
          withdrawal.description?.trim() ||
          null,
        createdAt: toDate(withdrawal.created_date) ?? undefined,
        updatedAt: toDate(withdrawal.updated_date) ?? undefined,
      },
    });

    await createLegacyImportRecord(params.lookup, {
      userId: params.userId,
      section: "wallet_withdrawals",
      legacyId: withdrawal.id,
      targetType: "PENARIKAN",
      targetId: created.id,
      title: position.label,
      subtitle: "wallet-withdrawal",
      payload: withdrawal,
      legacyCreatedAt: toDate(withdrawal.created_date),
      legacyUpdatedAt: toDate(withdrawal.updated_date),
    });

    params.summary.created.withdrawals += 1;
  }
}

async function archiveUnsupportedSections(params: {
  userId: number;
  backup: LegacyBackup;
  lookup: Map<string, LegacyImportRow>;
  summary: ImportSummary;
}) {
  const archiveSection = async (
    section: string,
    items: LegacyArbitraryRecord[] | undefined,
    getTitle: (item: LegacyArbitraryRecord, index: number) => string,
    getSubtitle?: (item: LegacyArbitraryRecord) => string | null,
  ) => {
    for (let index = 0; index < (items?.length ?? 0); index += 1) {
      const item = items![index];
      await archiveRawItem({
        userId: params.userId,
        section,
        legacyId: item.id ?? `${section}-${index + 1}`,
        title: getTitle(item, index),
        subtitle: getSubtitle?.(item) ?? null,
        payload: item,
        lookup: params.lookup,
        summary: params.summary,
      });
    }
  };

  await archiveSection("notes", params.backup.notes, (item, index) => {
    return item.title?.toString().trim() || `Legacy note ${index + 1}`;
  }, (item) => item.type?.toString() ?? null);

  await archiveSection("revisions", params.backup.revisions, (item, index) => {
    return item.title?.toString().trim() || `Legacy revision ${index + 1}`;
  }, (item) => item.submitter_name?.toString() ?? null);

  await archiveSection(
    "murabahah_schedules",
    params.backup.murabahah_schedules,
    (_item, index) => `Legacy murabahah schedule ${index + 1}`,
  );
}

export async function importLegacyBackup(params: {
  userId: number;
  backup: LegacyBackup;
  mappings: LegacyInvestmentMapping[];
}) {
  const summary = createSummary();
  const existingItems = await db.legacyImportItem.findMany({
    where: { userId: params.userId },
    orderBy: { id: "asc" },
  });
  const lookup = makeLookup(existingItems);

  const templates = await importTemplates({
    userId: params.userId,
    backup: params.backup,
    lookup,
    summary,
  });

  await importLegacyInvestments({
    userId: params.userId,
    backup: params.backup,
    mappings: params.mappings,
    templates,
    lookup,
    summary,
  });

  await importWalletWithdrawals({
    userId: params.userId,
    backup: params.backup,
    templates,
    lookup,
    summary,
  });

  await importWalletSnapshots({
    userId: params.userId,
    backup: params.backup,
    templates,
    lookup,
    summary,
  });

  await archiveUnsupportedSections({
    userId: params.userId,
    backup: params.backup,
    lookup,
    summary,
  });

  return { summary } satisfies ImportResult;
}
