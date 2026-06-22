import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json().catch(() => ({}));
    const tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
    const keterangan =
      typeof body.keterangan === "string" && body.keterangan.trim()
        ? body.keterangan.trim()
        : "Dilunasi sekaligus";

    if (Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    const pending = await db.zakat.findMany({
      where: {
        userId,
        status: { in: ["BELUM", "SEBAGIAN"] },
      },
      orderBy: [{ tanggalWajib: "desc" }, { id: "desc" }],
    });

    const items = pending
      .map((z) => ({ ...z, sisa: z.jumlah - z.sudahDibayar }))
      .filter((z) => z.sisa > 0);

    if (items.length === 0) {
      return NextResponse.json({ count: 0, total: 0 });
    }

    await db.$transaction(async (tx) => {
      for (const item of items) {
        await tx.pembayaranZakat.create({
          data: {
            zakatId: item.id,
            userId,
            tanggal,
            jumlah: item.sisa,
            keterangan,
          },
        });

        await tx.zakat.update({
          where: { id: item.id },
          data: {
            sudahDibayar: item.jumlah,
            status: "SUDAH",
            tanggalBayar: tanggal,
          },
        });
      }
    });

    const total = items.reduce((sum, item) => sum + item.sisa, 0);
    return NextResponse.json({ count: items.length, total });
  } catch (err: unknown) {
    console.error("ZAKAT_BAYAR_SEMUA error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
