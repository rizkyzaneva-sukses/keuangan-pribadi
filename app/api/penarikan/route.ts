import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { walletPosId, nominal, tanggal, akun, keterangan } = body;

    if (!walletPosId || !nominal || !tanggal) {
      return NextResponse.json({ message: "walletPosId, nominal, tanggal required" }, { status: 400 });
    }

    const wp = await db.walletPos.findFirst({ where: { id: walletPosId, userId } });
    if (!wp) return NextResponse.json({ message: "Wallet pos not found" }, { status: 404 });
    if (Number(nominal) > wp.saldoSaatIni) {
      return NextResponse.json({ message: "Saldo tidak cukup" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const penarikan = await tx.penarikan.create({
        data: {
          userId,
          walletPosId,
          nominal: Number(nominal),
          tanggal: new Date(tanggal),
          akun: akun || null,
          keterangan: keterangan || null,
        },
      });
      await tx.walletPos.update({
        where: { id: walletPosId },
        data: {
          saldoSaatIni: { decrement: Number(nominal) },
          totalKeluar: { increment: Number(nominal) },
        },
      });
      return penarikan;
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("PENARIKAN_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
