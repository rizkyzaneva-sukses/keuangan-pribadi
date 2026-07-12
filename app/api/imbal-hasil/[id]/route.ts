import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAlokasiImbalHasil } from "@/lib/alokasiEngine";
import { getMurobahahReceiptSummary } from "@/lib/murobahah";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const imbalId = Number(id);

    const existing = await db.imbalHasilDiterima.findFirst({
      where: { id: imbalId, userId },
      include: { murobahah: true, zakat: true },
    });
    if (!existing) {
      return NextResponse.json({ message: "Imbal hasil tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const tanggal = body.tanggal ? new Date(body.tanggal) : null;
    const pokokDiterima = body.pokokDiterima !== undefined ? Number(body.pokokDiterima) : existing.pokokDiterima;
    const jumlah = body.jumlah !== undefined ? Number(body.jumlah) : existing.jumlah;
    const buktiPath = typeof body.buktiPath === "string" ? (body.buktiPath || null) : existing.buktiPath;

    if (!tanggal || Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    if (pokokDiterima <= 0 && jumlah <= 0) {
      return NextResponse.json({ message: "Isi pokok diterima atau imbal diterima terlebih dulu" }, { status: 400 });
    }

    const m = existing.murobahah;

    const summary = await getMurobahahReceiptSummary(m.id);
    const otherImbal = summary.totalImbalDiterima - existing.jumlah;
    const otherPokok = summary.totalPokokDiterima - existing.pokokDiterima;

    if (otherImbal + jumlah > m.totalImbalHasil) {
      return NextResponse.json({ message: "Imbal diterima melebihi total imbal murobahah" }, { status: 400 });
    }
    if (otherPokok + pokokDiterima > m.pokok) {
      return NextResponse.json({ message: "Pokok diterima melebihi pokok murobahah" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.imbalHasilDiterima.update({
        where: { id: imbalId },
        data: {
          tanggal,
          pokokDiterima,
          jumlah,
          buktiPath,
        },
      });

      if (existing.zakat.length > 0) {
        await tx.zakat.updateMany({
          where: { imbalHasilDiterimaId: imbalId, userId },
          data: {
            tahun: tanggal.getFullYear(),
            tanggalWajib: tanggal,
            jumlah: Math.round(jumlah * 0.025),
          },
        });
      } else if (jumlah > 0) {
        const zakatJumlah = Math.round(jumlah * 0.025);
        await tx.zakat.create({
          data: {
            userId,
            sumber: "MUROBAHAH",
            tahun: tanggal.getFullYear(),
            jumlah: zakatJumlah,
            tanggalWajib: tanggal,
            imbalHasilDiterimaId: imbalId,
            catatan: `Auto-generated zakat 2.5% dari imbal hasil ${m.namaPartner}`,
          },
        });
      }
    });

    await runAlokasiImbalHasil(imbalId);

    const updated = await db.imbalHasilDiterima.findUnique({
      where: { id: imbalId },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("IMBAL_HASIL_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
