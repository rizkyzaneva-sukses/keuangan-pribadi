import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json().catch(() => ({}));
    const tanggal = body.tanggal ? new Date(body.tanggal) : new Date();
    const akun =
      typeof body.akun === "string" && body.akun.trim() ? body.akun.trim() : "Kas/Bank";
    const keterangan =
      typeof body.keterangan === "string" && body.keterangan.trim()
        ? body.keterangan.trim()
        : "RESET dari 0";

    if (Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    const wallets = await db.walletPos.findMany({
      where: {
        userId,
        saldoSaatIni: { gt: 0 },
      },
      orderBy: { id: "asc" },
    });

    if (wallets.length === 0) {
      return NextResponse.json({ count: 0, total: 0 });
    }

    // Hitung total SEBELUM transaksi mengubah saldo jadi 0
    const total = wallets.reduce((sum, wallet) => sum + wallet.saldoSaatIni, 0);

    await db.$transaction(async (tx) => {
      for (const wallet of wallets) {
        await tx.penarikan.create({
          data: {
            userId,
            walletPosId: wallet.id,
            nominal: wallet.saldoSaatIni,
            tanggal,
            akun,
            keterangan,
          },
        });

        await tx.walletPos.update({
          where: { id: wallet.id },
          data: {
            saldoSaatIni: 0,
            totalKeluar: { increment: wallet.saldoSaatIni },
          },
        });
      }
    });

    return NextResponse.json({ count: wallets.length, total });
  } catch (err: unknown) {
    console.error("WALLET_RESET error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
