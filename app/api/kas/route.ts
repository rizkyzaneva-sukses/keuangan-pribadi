import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { tanggal, jenis, kategoriNama, keterangan, jumlah } = body;

    if (!tanggal || !jenis || !kategoriNama || !jumlah) {
      return NextResponse.json({ message: "All fields required" }, { status: 400 });
    }

    let kategori = await db.kategoriKas.findFirst({
      where: { userId, nama: kategoriNama },
    });

    if (!kategori) {
      kategori = await db.kategoriKas.create({
        data: { userId, nama: kategoriNama },
      });
    }

    const kas = await db.kas.create({
      data: {
        userId,
        kategoriId: kategori.id,
        tanggal: new Date(tanggal),
        jenis,
        keterangan: keterangan || "",
        jumlah: Number(jumlah),
      },
    });

    return NextResponse.json(kas);
  } catch (err: unknown) {
    console.error("KAS_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
