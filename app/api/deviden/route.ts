import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAlokasiDeviden } from "@/lib/alokasiEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { investasiTemanId, tanggal, jumlah } = body;

    if (!investasiTemanId || !tanggal || !jumlah) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 });
    }

    const teman = await db.investasiTeman.findFirst({
      where: { id: Number(investasiTemanId), userId },
    });
    if (!teman) return NextResponse.json({ message: "Investasi teman not found" }, { status: 404 });

    const tgl = new Date(tanggal);
    const jml = Number(jumlah);

    const result = await db.$transaction(async (tx) => {
      const source = await tx.investasiTeman.findFirst({
        where: { id: Number(investasiTemanId), userId },
        select: { templateId: true },
      });

      const deviden = await tx.deviden.create({
        data: {
          userId,
          investasiTemanId: Number(investasiTemanId),
          templateId: source?.templateId ?? null,
          tanggal: tgl,
          jumlah: jml,
        },
      });

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

    await runAlokasiDeviden(result.id);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("DEVIDEN_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
