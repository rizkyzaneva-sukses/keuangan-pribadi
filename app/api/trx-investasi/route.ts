import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { runAlokasi } from "@/lib/alokasiEngine";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { investasiId, tanggal, arah, kategori, principal, profit, total, metodeBayar, akun, catatan } = body;

    if (!investasiId || !tanggal || !arah || !kategori) {
      return NextResponse.json({ message: "Required fields missing" }, { status: 400 });
    }

    const investasi = await db.investasi.findFirst({
      where: { id: Number(investasiId), userId },
    });
    if (!investasi) {
      return NextResponse.json({ message: "Investasi not found" }, { status: 404 });
    }

    const validArah = ["IN", "OUT"];
    if (!validArah.includes(arah)) {
      return NextResponse.json({ message: "Arah tidak valid" }, { status: 400 });
    }

    const trx = await db.trxInvestasi.create({
      data: {
        userId,
        investasiId: Number(investasiId),
        tanggal: new Date(tanggal),
        arah,
        kategori,
        principal: Number(principal || 0),
        profit: Number(profit || 0),
        total: Number(total || 0),
        metodeBayar: metodeBayar || null,
        akun: akun || null,
        catatan: catatan || null,
      },
    });

    try {
      await runAlokasi(trx.id);
    } catch (e) {
      console.error("Alokasi error (non-blocking):", e);
    }

    return NextResponse.json(trx);
  } catch (err: unknown) {
    console.error("TRX_INVESTASI_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
