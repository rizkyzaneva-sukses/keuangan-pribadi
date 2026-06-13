import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireUser();
    const { id } = await ctx.params;
    const zakatId = Number(id);

    const body = await req.json().catch(() => ({}));
    const tanggal: string | undefined = body.tanggal;
    const jumlah: number | undefined = body.jumlah;
    const keterangan: string | undefined = body.keterangan;

    if (!jumlah || jumlah <= 0) {
      return NextResponse.json({ message: "Jumlah harus lebih dari 0" }, { status: 400 });
    }

    const z = await db.zakat.findFirst({ where: { id: zakatId, userId } });
    if (!z) return NextResponse.json({ message: "Zakat tidak ditemukan" }, { status: 404 });
    if (z.status === "SUDAH") return NextResponse.json({ message: "Zakat sudah lunas" }, { status: 400 });

    const sisa = z.jumlah - z.sudahDibayar;
    if (jumlah > sisa) {
      return NextResponse.json({ message: `Jumlah melebihi sisa kewajiban (${sisa})` }, { status: 400 });
    }

    const sudahDibayarBaru = z.sudahDibayar + jumlah;
    const lunas = sudahDibayarBaru >= z.jumlah;

    const [pembayaran] = await db.$transaction([
      db.pembayaranZakat.create({
        data: {
          zakatId,
          userId,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          jumlah,
          keterangan: keterangan || null,
        },
      }),
      db.zakat.update({
        where: { id: zakatId },
        data: {
          sudahDibayar: sudahDibayarBaru,
          status: lunas ? "SUDAH" : "SEBAGIAN",
          tanggalBayar: lunas ? (tanggal ? new Date(tanggal) : new Date()) : null,
        },
      }),
    ]);

    return NextResponse.json({ pembayaran, lunas });
  } catch (err: unknown) {
    console.error("ZAKAT_BAYAR error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
