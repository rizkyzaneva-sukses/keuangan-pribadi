import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
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
    const trxId = Number(id);

    const existing = await db.trxInvestasi.findFirst({
      where: { id: trxId, userId },
    });
    if (!existing) {
      return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const body = await req.json();
    const tanggal = body.tanggal ? new Date(body.tanggal) : null;
    const arah = String(body.arah || "").trim();
    const kategori = String(body.kategori || "").trim();
    const principal = Number(body.principal || 0);
    const profit = Number(body.profit || 0);
    const total = Number(body.total || 0);
    const metodeBayar = body.metodeBayar ? String(body.metodeBayar).trim() : null;
    const akun = body.akun ? String(body.akun).trim() : null;
    const catatan = body.catatan ? String(body.catatan).trim() : null;
    const buktiPath = typeof body.buktiPath === "string" && body.buktiPath ? body.buktiPath : null;

    if (!tanggal || Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    const validArah = ["IN", "OUT"];
    if (!validArah.includes(arah)) {
      return NextResponse.json({ message: "Arah tidak valid" }, { status: 400 });
    }

    await db.trxInvestasi.update({
      where: { id: trxId },
      data: {
        tanggal,
        arah,
        kategori,
        principal,
        profit,
        total,
        metodeBayar: metodeBayar || null,
        akun: akun || null,
        catatan: catatan || null,
        buktiPath,
      },
    });

    await syncAlokasiInvestasi(existing.investasiId);

    const updated = await db.trxInvestasi.findUnique({
      where: { id: trxId },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("TRX_INVESTASI_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
