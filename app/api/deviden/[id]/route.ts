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

    if (!tanggal || Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    const [updated] = await db.$transaction([
      db.deviden.update({
        where: { id: devidenId },
        data: { tanggal },
      }),
      db.zakat.updateMany({
        where: { devidenId, userId },
        data: {
          tahun: tanggal.getFullYear(),
          tanggalWajib: tanggal,
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
