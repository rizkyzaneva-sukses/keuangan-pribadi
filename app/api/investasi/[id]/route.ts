import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncAlokasiInvestasi } from "@/lib/alokasiEngine";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const investasiId = Number(id);

    const investasi = await db.investasi.findFirst({
      where: { id: investasiId, userId },
      include: { templateAssignment: true },
    });

    if (!investasi) {
      return NextResponse.json({ message: "Investasi not found" }, { status: 404 });
    }

    const body = await req.json();
    const nama = String(body.nama || "").trim();
    const partner = body.partner ? String(body.partner).trim() : "";
    const tipe = String(body.tipe || "").trim();
    const catatan = body.catatan ? String(body.catatan).trim() : "";
    const templateId = body.templateId === null || body.templateId === undefined || body.templateId === ""
      ? null
      : Number(body.templateId);

    if (!nama || !tipe) {
      return NextResponse.json({ message: "Nama dan tipe wajib diisi" }, { status: 400 });
    }

    const validTipe = ["BISNIS", "TEMAN", "MUROBAHAH"];
    if (!validTipe.includes(tipe)) {
      return NextResponse.json({ message: "Tipe tidak valid" }, { status: 400 });
    }

    if (templateId !== null && Number.isNaN(templateId)) {
      return NextResponse.json({ message: "Template tidak valid" }, { status: 400 });
    }

    if (templateId !== null) {
      const template = await db.templateAlokasi.findFirst({
        where: { id: templateId, userId },
      });
      if (!template) {
        return NextResponse.json({ message: "Template tidak ditemukan" }, { status: 404 });
      }
    }

    await db.$transaction(async (tx) => {
      await tx.investasi.update({
        where: { id: investasiId },
        data: {
          nama,
          partner: partner || null,
          tipe: tipe as "BISNIS" | "TEMAN" | "MUROBAHAH",
          catatan: catatan || null,
        },
      });

      if (templateId === null) {
        await tx.templateAssignment.deleteMany({ where: { investasiId } });
      } else {
        await tx.templateAssignment.upsert({
          where: { investasiId },
          update: { templateId },
          create: { investasiId, templateId },
        });
      }
    });

    await syncAlokasiInvestasi(investasiId);

    const updated = await db.investasi.findUnique({
      where: { id: investasiId },
      include: {
        transaksi: { orderBy: { tanggal: "desc" } },
        templateAssignment: { include: { template: { include: { pos: { orderBy: { urutan: "asc" } } } } } },
        overrides: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("INVESTASI_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
