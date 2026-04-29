import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { murobahahId, tanggal, jumlah } = body;

  if (!murobahahId || !tanggal || !jumlah) {
    return new NextResponse("Required fields missing", { status: 400 });
  }

  const m = await db.murobahah.findFirst({ where: { id: Number(murobahahId), userId } });
  if (!m) return new NextResponse("Murobahah not found", { status: 404 });

  const tgl = new Date(tanggal);
  const jml = Number(jumlah);

  const result = await db.$transaction(async (tx) => {
    const imbal = await tx.imbalHasilDiterima.create({
      data: {
        userId,
        murobahahId: Number(murobahahId),
        tanggal: tgl,
        jumlah: jml,
      },
    });

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

    return imbal;
  });

  return NextResponse.json(result);
}
