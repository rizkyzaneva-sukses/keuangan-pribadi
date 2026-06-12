import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { nama, catatan, isDefault, pos } = body as {
      nama: string;
      catatan?: string;
      isDefault?: boolean;
      pos: { nama: string; persentase: number }[];
    };

    if (!nama || !pos?.length) return NextResponse.json({ message: "Nama & pos required" }, { status: 400 });
    const total = pos.reduce((s, p) => s + Number(p.persentase || 0), 0);
    if (total !== 100) return NextResponse.json({ message: "Total persentase harus 100%" }, { status: 400 });

    if (isDefault) {
      await db.templateAlokasi.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await db.templateAlokasi.create({
      data: {
        userId,
        nama,
        catatan: catatan || null,
        isDefault: !!isDefault,
        pos: {
          create: pos.map((p, i) => ({
            nama: p.nama,
            persentase: Number(p.persentase),
            urutan: i + 1,
          })),
        },
      },
      include: { pos: true },
    });

    for (const p of created.pos) {
      await db.walletPos.upsert({
        where: { posId: p.id },
        update: {},
        create: { userId, posId: p.id },
      });
    }

    return NextResponse.json(created);
  } catch (err: unknown) {
    console.error("TEMPLATES_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
