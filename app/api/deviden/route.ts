import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { investasiTemanId, tanggal, jumlah } = body;

  if (!investasiTemanId || !tanggal || !jumlah) {
    return new NextResponse("Required fields missing", { status: 400 });
  }

  const teman = await db.investasiTeman.findFirst({
    where: { id: Number(investasiTemanId), userId },
  });
  if (!teman) return new NextResponse("Investasi teman not found", { status: 404 });

  const tgl = new Date(tanggal);
  const jml = Number(jumlah);

  const result = await db.$transaction(async (tx) => {
    const deviden = await tx.deviden.create({
      data: {
        userId,
        investasiTemanId: Number(investasiTemanId),
        tanggal: tgl,
        jumlah: jml,
      },
    });

    // Auto zakat 2.5% dari deviden
    const zakatJumlah = Math.round(jml * 0.025);
    await tx.zakat.create({
      data: {
        userId,
        sumber: "DEVIDEN",
        tahun: tgl.getFullYear(),
        jumlah: zakatJumlah,
        tanggalWajib: tgl,
        devidenId: deviden.id,
        catatan: `Auto-generated zakat 2.5% dari deviden ${teman.namaTeman}`,
      },
    });

    return deviden;
  });

  return NextResponse.json(result);
}
