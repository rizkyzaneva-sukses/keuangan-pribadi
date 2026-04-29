import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { nama, partner, tipe, catatan, templateId } = body;

  if (!nama || !tipe) {
    return new NextResponse("Nama dan tipe wajib diisi", { status: 400 });
  }

  const validTipe = ["BISNIS", "TEMAN", "MUROBAHAH"];
  if (!validTipe.includes(tipe)) {
    return new NextResponse("Tipe tidak valid", { status: 400 });
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

  // Jika templateId dipilih, buat assignment
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
}
