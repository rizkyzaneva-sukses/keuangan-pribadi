import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { namaTeman, modal, tanggalMulai, catatan, templateId } = body;

  if (!namaTeman || !modal || !tanggalMulai) {
    return new NextResponse("Required fields missing", { status: 400 });
  }

  const resolvedTemplateId =
    templateId === null || templateId === undefined || templateId === ""
      ? null
      : Number(templateId);

  if (resolvedTemplateId !== null) {
    const template = await db.templateAlokasi.findFirst({
      where: { id: resolvedTemplateId, userId },
      select: { id: true },
    });
    if (!template) {
      return new NextResponse("Template tidak ditemukan", { status: 404 });
    }
  }

  const teman = await db.investasiTeman.create({
    data: {
      userId,
      namaTeman,
      modal: Number(modal),
      tanggalMulai: new Date(tanggalMulai),
      catatan: catatan || null,
      templateId: resolvedTemplateId,
    },
  });
  return NextResponse.json(teman);
}
