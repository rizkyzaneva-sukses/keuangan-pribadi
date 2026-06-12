import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { namaTeman, modal, tanggalMulai, catatan, templateId } = body;

    if (!namaTeman || !modal || !tanggalMulai) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 });
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
        return NextResponse.json({ message: "Template tidak ditemukan" }, { status: 404 });
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
  } catch (err: unknown) {
    console.error("TEMAN_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
