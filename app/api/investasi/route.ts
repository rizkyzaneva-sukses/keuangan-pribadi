import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { nama, partner, tipe, catatan, templateId } = body;

    if (!nama || !tipe) {
      return NextResponse.json({ message: "Nama dan tipe wajib diisi" }, { status: 400 });
    }

    const validTipe = ["BISNIS", "TEMAN", "MUROBAHAH"];
    if (!validTipe.includes(tipe)) {
      return NextResponse.json({ message: "Tipe tidak valid" }, { status: 400 });
    }

    const investasi = await db.investasi.create({
      data: {
        userId,
        nama,
        partner: partner || null,
        tipe,
        catatan: catatan || null,
      },
    });

    if (templateId) {
      const template = await db.templateAlokasi.findFirst({
        where: { id: Number(templateId), userId },
      });
      if (template) {
        await db.templateAssignment.create({
          data: {
            investasiId: investasi.id,
            templateId: template.id,
          },
        });
      }
    }

    return NextResponse.json(investasi);
  } catch (err: unknown) {
    console.error("INVESTASI_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
