import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { repairMurobahahReceipts, getMurobahahReceiptSummary } from "@/lib/murobahah";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await requireUser();
  const { id } = await params;
  const murobahahId = Number(id);

  const existing = await db.murobahah.findFirst({
    where: { id: murobahahId, userId },
  });
  if (!existing) return new NextResponse("Murobahah not found", { status: 404 });

  const body = await req.json();
  const namaPartner = String(body.namaPartner || "").trim();
  const catatan = body.catatan ? String(body.catatan).trim() : "";
  const pokok = Number(body.pokok);
  const totalImbalHasil = Number(body.totalImbalHasil);
  const tanggalMulai = body.tanggalMulai ? new Date(body.tanggalMulai) : null;
  const jatuhTempo = body.jatuhTempo ? new Date(body.jatuhTempo) : null;
  const templateId =
    body.templateId === null || body.templateId === undefined || body.templateId === ""
      ? null
      : Number(body.templateId);

  if (!namaPartner || !pokok || !totalImbalHasil || !tanggalMulai || !jatuhTempo) {
    return new NextResponse("Required fields missing", { status: 400 });
  }

  if (templateId !== null) {
    const template = await db.templateAlokasi.findFirst({
      where: { id: templateId, userId },
      select: { id: true },
    });
    if (!template) return new NextResponse("Template tidak ditemukan", { status: 404 });
  }

  const summary = await getMurobahahReceiptSummary(murobahahId);
  if (summary.totalPokokDiterima > pokok) {
    return new NextResponse("Pokok baru lebih kecil dari pokok yang sudah diterima", { status: 400 });
  }
  if (summary.totalImbalDiterima > totalImbalHasil) {
    return new NextResponse("Total imbal baru lebih kecil dari imbal yang sudah diterima", { status: 400 });
  }

  await db.murobahah.update({
    where: { id: murobahahId },
    data: {
      namaPartner,
      pokok,
      totalImbalHasil,
      tanggalMulai,
      jatuhTempo,
      catatan: catatan || null,
      templateId,
    },
  });

  await repairMurobahahReceipts(murobahahId);

  const updated = await db.murobahah.findUnique({
    where: { id: murobahahId },
    include: {
      template: true,
      imbalHasilDiterima: { orderBy: { tanggal: "desc" } },
    },
  });

  return NextResponse.json(updated);
}
