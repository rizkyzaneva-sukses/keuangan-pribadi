import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { namaPartner, pokok, totalImbalHasil, tanggalMulai, jatuhTempo, catatan, templateId, buktiPath } = body;

    if (!namaPartner || !pokok || !totalImbalHasil || !tanggalMulai || !jatuhTempo) {
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
        buktiPath: typeof buktiPath === "string" && buktiPath ? buktiPath : null,
      },
    });
    return NextResponse.json(m);
  } catch (err: unknown) {
    console.error("MUROBAHAH_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
