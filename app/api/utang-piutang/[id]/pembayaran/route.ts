import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JenisKas, Prisma, StatusUtangPiutang } from "@prisma/client";

function hitungStatus(jumlah: number, sudahDibayar: number): StatusUtangPiutang {
  if (sudahDibayar <= 0) return "BELUM";
  if (sudahDibayar >= jumlah) return "LUNAS";
  return "SEBAGIAN";
}

async function buatKas(
  tx: Prisma.TransactionClient,
  {
    userId,
    tanggal,
    jenis,
    kategoriNama,
    keterangan,
    jumlah,
  }: {
    userId: number;
    tanggal: Date;
    jenis: JenisKas;
    kategoriNama: string;
    keterangan: string;
    jumlah: number;
  }
) {
  let kategori = await tx.kategoriKas.findFirst({
    where: { userId, nama: kategoriNama },
  });

  if (!kategori) {
    kategori = await tx.kategoriKas.create({
      data: { userId, nama: kategoriNama },
    });
  }

  await tx.kas.create({
    data: {
      userId,
      kategoriId: kategori.id,
      tanggal,
      jenis,
      keterangan,
      jumlah,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const utangPiutangId = Number(id);
    const body = await req.json().catch(() => ({}));

    const jumlah = Number(body.jumlah);
    const tanggal = body.tanggal ? new Date(body.tanggal) : null;
    const keterangan = body.keterangan ? String(body.keterangan).trim() : "";
    const catatKas = body.catatKas !== false;
    const buktiPath = typeof body.buktiPath === "string" && body.buktiPath ? body.buktiPath : null;

    if (!jumlah || !tanggal) {
      return NextResponse.json({ message: "Jumlah dan tanggal wajib diisi" }, { status: 400 });
    }

    if (Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    const item = await db.utangPiutang.findFirst({
      where: { id: utangPiutangId, userId },
    });

    if (!item) {
      return NextResponse.json({ message: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const sisa = item.jumlah - item.sudahDibayar;
    if (jumlah > sisa) {
      return NextResponse.json({ message: `Jumlah melebihi sisa tagihan (${sisa})` }, { status: 400 });
    }

    const sudahDibayarBaru = item.sudahDibayar + jumlah;
    const statusBaru = hitungStatus(item.jumlah, sudahDibayarBaru);

    const pembayaran = await db.$transaction(async (tx) => {
      const pembayaranBaru = await tx.pembayaranUtangPiutang.create({
        data: {
          utangPiutangId,
          userId,
          tanggal,
          jumlah,
          keterangan: keterangan || null,
          buktiPath,
        },
      });

      await tx.utangPiutang.update({
        where: { id: utangPiutangId },
        data: {
          sudahDibayar: sudahDibayarBaru,
          status: statusBaru,
        },
      });

      if (catatKas) {
        await buatKas(tx, {
          userId,
          tanggal,
          jumlah,
          jenis: item.jenis === "UTANG" ? "KELUAR" : "MASUK",
          kategoriNama: "Utang Piutang",
          keterangan:
            item.jenis === "UTANG"
              ? `Pembayaran utang ke ${item.namaPihak}`
              : `Penerimaan piutang dari ${item.namaPihak}`,
        });
      }

      return pembayaranBaru;
    });

    return NextResponse.json({ pembayaran, status: statusBaru });
  } catch (err: unknown) {
    console.error("UTANG_PIUTANG_BAYAR error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
