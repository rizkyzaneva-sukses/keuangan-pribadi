import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAlokasiImbalHasil } from "@/lib/alokasiEngine";
import { getMurobahahReceiptSummary } from "@/lib/murobahah";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { murobahahId, tanggal, jumlah, pokokDiterima } = body;

    if (!murobahahId || !tanggal) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 });
    }

    const m = await db.murobahah.findFirst({ where: { id: Number(murobahahId), userId } });
    if (!m) return NextResponse.json({ message: "Murobahah not found" }, { status: 404 });

    const tgl = new Date(tanggal);
    const jml = Number(jumlah || 0);
    const pokokMasuk = Number(pokokDiterima || 0);

    if (jml <= 0 && pokokMasuk <= 0) {
      return NextResponse.json({ message: "Isi pokok diterima atau imbal diterima terlebih dulu" }, { status: 400 });
    }

    const summary = await getMurobahahReceiptSummary(Number(murobahahId));
    if (summary.totalImbalDiterima + jml > m.totalImbalHasil) {
      return NextResponse.json({ message: "Imbal diterima melebihi total imbal murobahah" }, { status: 400 });
    }
    if (summary.totalPokokDiterima + pokokMasuk > m.pokok) {
      return NextResponse.json({ message: "Pokok diterima melebihi pokok murobahah" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const source = await tx.murobahah.findFirst({
        where: { id: Number(murobahahId), userId },
        select: { templateId: true },
      });

      const imbal = await tx.imbalHasilDiterima.create({
        data: {
          userId,
          murobahahId: Number(murobahahId),
          templateId: source?.templateId ?? null,
          tanggal: tgl,
          pokokDiterima: pokokMasuk,
          jumlah: jml,
        },
      });

      if (jml > 0) {
        const zakatJumlah = Math.round(jml * 0.025);
        await tx.zakat.create({
          data: {
            userId,
            sumber: "MUROBAHAH",
            tahun: tgl.getFullYear(),
            jumlah: zakatJumlah,
            tanggalWajib: tgl,
            imbalHasilDiterimaId: imbal.id,
            catatan: `Auto-generated zakat 2.5% dari imbal hasil ${m.namaPartner}`,
          },
        });
      }

      return imbal;
    });

    await runAlokasiImbalHasil(result.id);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("IMBAL_HASIL_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
