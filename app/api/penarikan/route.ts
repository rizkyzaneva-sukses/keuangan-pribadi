import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { walletPosId, nominal, tanggal, akun, keterangan } = body;

  if (!walletPosId || !nominal || !tanggal) {
    return new NextResponse("walletPosId, nominal, tanggal required", { status: 400 });
  }

  const wp = await db.walletPos.findFirst({ where: { id: walletPosId, userId } });
  if (!wp) return new NextResponse("Wallet pos not found", { status: 404 });
  if (Number(nominal) > wp.saldoSaatIni) {
    return new NextResponse("Saldo tidak cukup", { status: 400 });
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
}
