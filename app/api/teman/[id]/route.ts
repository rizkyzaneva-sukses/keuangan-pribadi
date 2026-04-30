import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncAlokasiTeman } from "@/lib/alokasiEngine";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await requireUser();
  const { id } = await params;
  const investasiTemanId = Number(id);

  const existing = await db.investasiTeman.findFirst({
    where: { id: investasiTemanId, userId },
  });
  if (!existing) return new NextResponse("Investasi teman not found", { status: 404 });

  const body = await req.json();
  const namaTeman = String(body.namaTeman || "").trim();
  const catatan = body.catatan ? String(body.catatan).trim() : "";
  const modal = Number(body.modal);
  const tanggalMulai = body.tanggalMulai ? new Date(body.tanggalMulai) : null;
  const templateId =
    body.templateId === null || body.templateId === undefined || body.templateId === ""
      ? null
      : Number(body.templateId);

  if (!namaTeman || !modal || !tanggalMulai) {
    return new NextResponse("Required fields missing", { status: 400 });
  }

  if (templateId !== null) {
    const template = await db.templateAlokasi.findFirst({
      where: { id: templateId, userId },
      select: { id: true },
    });
    if (!template) return new NextResponse("Template tidak ditemukan", { status: 404 });
  }

  await db.investasiTeman.update({
    where: { id: investasiTemanId },
    data: {
      namaTeman,
      modal,
      tanggalMulai,
      catatan: catatan || null,
      templateId,
    },
  });

  await syncAlokasiTeman(investasiTemanId);

  const updated = await db.investasiTeman.findUnique({
    where: { id: investasiTemanId },
    include: {
      template: true,
      deviden: { orderBy: { tanggal: "desc" } },
    },
  });

  return NextResponse.json(updated);
}
