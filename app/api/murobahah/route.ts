import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { namaPartner, pokok, totalImbalHasil, tanggalMulai, jatuhTempo, catatan, templateId } = body;

  if (!namaPartner || !pokok || !totalImbalHasil || !tanggalMulai || !jatuhTempo) {
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

  const m = await db.murobahah.create({
    data: {
      userId,
      templateId: resolvedTemplateId,
      namaPartner,
      pokok: Number(pokok),
      totalImbalHasil: Number(totalImbalHasil),
      tanggalMulai: new Date(tanggalMulai),
      jatuhTempo: new Date(jatuhTempo),
      catatan: catatan || null,
    },
  });
  return NextResponse.json(m);
}
