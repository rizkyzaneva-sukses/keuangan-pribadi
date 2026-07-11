import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const deleted = await db.trxInvestasi.deleteMany({
      where: { id: { in: [15, 16] } },
    });

    const trx1 = await db.trxInvestasi.create({
      data: {
        userId: 2,
        investasiId: 5,
        tanggal: new Date("2026-06-01"),
        arah: "OUT",
        kategori: "OUT_OTHER",
        principal: 38980000,
        profit: 0,
        total: 38980000,
        catatan: "Suntikan Dana",
        buktiPath: "/api/uploads/0c53cb77-e69c-4bdb-aad4-83765f96eb83.jpg",
      },
    });

    const trx2 = await db.trxInvestasi.create({
      data: {
        userId: 2,
        investasiId: 5,
        tanggal: new Date("2026-07-06"),
        arah: "OUT",
        kategori: "OUT_OTHER",
        principal: 9000000,
        profit: 0,
        total: 9000000,
        catatan: "Suntikan Dana",
        buktiPath: "/api/uploads/4c1767b8-7205-4c3a-8aa0-4d15bf5f512f.jpeg",
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: deleted.count,
      created: [trx1.id, trx2.id],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
