import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    const zakatId = Number(id);

    const z = await db.zakat.findFirst({ where: { id: zakatId, userId } });
    if (!z) return NextResponse.json({ message: "Zakat tidak ditemukan" }, { status: 404 });

    const pembayaran = await db.pembayaranZakat.findMany({
      where: { zakatId },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ zakat: z, pembayaran });
  } catch (err: unknown) {
    console.error("ZAKAT_PEMBAYARAN_GET error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
