import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** GET /api/zakat/[id]/pembayaran — list riwayat pembayaran */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { userId } = await requireUser();
  const { id } = await ctx.params;
  const zakatId = Number(id);

  const z = await db.zakat.findFirst({ where: { id: zakatId, userId } });
  if (!z) return new NextResponse("Zakat tidak ditemukan", { status: 404 });

  const pembayaran = await db.pembayaranZakat.findMany({
    where: { zakatId },
    orderBy: { tanggal: "desc" },
  });

  return NextResponse.json({ zakat: z, pembayaran });
}
