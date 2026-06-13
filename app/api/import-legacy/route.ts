import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { LegacyBackup } from "@/lib/legacyBackup";
import { importLegacyBackup } from "@/lib/legacyImport";

const mappingSchema = z.object({
  legacyInvestmentId: z.string().min(1),
  target: z.enum(["INVESTASI", "TEMAN", "MUROBAHAH", "SKIP"]),
});

const requestSchema = z.object({
  backup: z.object({
    exported_at: z.string().nullable().optional(),
    investments: z.array(z.record(z.string(), z.unknown())).optional(),
    transactions: z.array(z.record(z.string(), z.unknown())).optional(),
    murabahah_schedules: z.array(z.record(z.string(), z.unknown())).optional(),
    allocation_wallets: z.array(z.record(z.string(), z.unknown())).optional(),
    wallet_withdrawals: z.array(z.record(z.string(), z.unknown())).optional(),
    allocation_templates: z.array(z.record(z.string(), z.unknown())).optional(),
    notes: z.array(z.record(z.string(), z.unknown())).optional(),
    revisions: z.array(z.record(z.string(), z.unknown())).optional(),
  }),
  mappings: z.array(mappingSchema).default([]),
});

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();

  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Payload import tidak valid",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await importLegacyBackup({
      userId,
      backup: parsed.data.backup as unknown as LegacyBackup,
      mappings: parsed.data.mappings,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal import backup lama";
    console.error("Legacy import error:", error);
    return NextResponse.json(
      { message },
      { status: 500 },
    );
  }
}
