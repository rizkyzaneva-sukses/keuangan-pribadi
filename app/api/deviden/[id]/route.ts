import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const devidenId = Number(id);

    const existing = await db.deviden.findFirst({
      where: { id: devidenId, userId },
      include: { zakat: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Deviden tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const tanggal = body.tanggal ? new Date(body.tanggal) : null;
    const jumlah = body.jumlah !== undefined ? Number(body.jumlah) : existing.jumlah;
    const buktiPath = typeof body.buktiPath === "string" ? (body.buktiPath || null) : existing.buktiPath;

    if (!tanggal || Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    if (jumlah <= 0) {
      return NextResponse.json({ message: "Jumlah harus lebih dari 0" }, { status: 400 });
    }

    const [updated] = await db.$transaction([
      db.deviden.update({
        where: { id: devidenId },
        data: { tanggal, jumlah, buktiPath },
      }),
      db.zakat.updateMany({
        where: { devidenId, userId },
        data: {
          tahun: tanggal.getFullYear(),
          tanggalWajib: tanggal,
          jumlah: Math.round(jumlah * 0.025),
        },
      }),
    ]);

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("DEVIDEN_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
