import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JenisKas, JenisUtangPiutang, Prisma, StatusUtangPiutang } from "@prisma/client";

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

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json().catch(() => ({}));

    const jenis = body.jenis as JenisUtangPiutang | undefined;
    const namaPihak = String(body.namaPihak || "").trim();
    const jumlah = Number(body.jumlah);
    const tanggal = body.tanggal ? new Date(body.tanggal) : null;
    const jatuhTempo = body.jatuhTempo ? new Date(body.jatuhTempo) : null;
    const catatan = body.catatan ? String(body.catatan).trim() : "";
    const catatKas = body.catatKas !== false;
    const buktiPath = typeof body.buktiPath === "string" && body.buktiPath ? body.buktiPath : null;

    if ((jenis !== "UTANG" && jenis !== "PIUTANG") || !namaPihak || !jumlah || !tanggal) {
      return NextResponse.json({ message: "Data utang/piutang belum lengkap" }, { status: 400 });
    }

    if (Number.isNaN(tanggal.getTime()) || (jatuhTempo && Number.isNaN(jatuhTempo.getTime()))) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }

    const created = await db.$transaction(async (tx) => {
      const item = await tx.utangPiutang.create({
        data: {
          userId,
          jenis,
          namaPihak,
          tanggal,
          jatuhTempo,
          jumlah,
          catatan: catatan || null,
          buktiPath,
        },
      });

      if (catatKas) {
        await buatKas(tx, {
          userId,
          tanggal,
          jumlah,
          jenis: jenis === "UTANG" ? "MASUK" : "KELUAR",
          kategoriNama: "Utang Piutang",
          keterangan:
            jenis === "UTANG"
              ? `Pencatatan utang dari ${namaPihak}`
              : `Pencatatan piutang ke ${namaPihak}`,
        });
      }

      return item;
    });

    return NextResponse.json(created);
  } catch (err: unknown) {
    console.error("UTANG_PIUTANG_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
