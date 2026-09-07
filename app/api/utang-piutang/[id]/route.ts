import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { JenisUtangPiutang, StatusUtangPiutang } from "@prisma/client";

function hitungStatus(jumlah: number, sudahDibayar: number): StatusUtangPiutang {
  if (sudahDibayar <= 0) return "BELUM";
  if (sudahDibayar >= jumlah) return "LUNAS";
  return "SEBAGIAN";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const utangPiutangId = Number(id);

    if (!utangPiutangId || Number.isNaN(utangPiutangId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const item = await db.utangPiutang.findFirst({
      where: { id: utangPiutangId, userId },
    });

    if (!item) {
      return NextResponse.json({ message: "Catatan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (err: unknown) {
    console.error("UTANG_PIUTANG_GET error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const utangPiutangId = Number(id);

    if (!utangPiutangId || Number.isNaN(utangPiutangId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    const item = await db.utangPiutang.findFirst({
      where: { id: utangPiutangId, userId },
    });

    if (!item) {
      return NextResponse.json({ message: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const jenis = body.jenis as JenisUtangPiutang | undefined;
    const namaPihak = body.namaPihak ? String(body.namaPihak).trim() : undefined;
    const tanggal = body.tanggal ? new Date(body.tanggal) : undefined;
    const jatuhTempo = body.jatuhTempo !== undefined ? (body.jatuhTempo ? new Date(body.jatuhTempo) : null) : undefined;
    const jumlah = body.jumlah !== undefined ? Number(body.jumlah) : undefined;
    const catatan = body.catatan !== undefined ? (body.catatan ? String(body.catatan).trim() : null) : undefined;
    const buktiPath = body.buktiPath !== undefined ? (typeof body.buktiPath === "string" && body.buktiPath ? body.buktiPath : null) : undefined;

    // Validate
    if (jenis !== undefined && jenis !== "UTANG" && jenis !== "PIUTANG") {
      return NextResponse.json({ message: "Jenis tidak valid" }, { status: 400 });
    }
    if (namaPihak !== undefined && !namaPihak) {
      return NextResponse.json({ message: "Nama pihak tidak boleh kosong" }, { status: 400 });
    }
    if (jumlah !== undefined && (!jumlah || Number.isNaN(jumlah))) {
      return NextResponse.json({ message: "Jumlah tidak valid" }, { status: 400 });
    }
    if (tanggal !== undefined && Number.isNaN(tanggal.getTime())) {
      return NextResponse.json({ message: "Tanggal tidak valid" }, { status: 400 });
    }
    if (jatuhTempo !== undefined && jatuhTempo !== null && Number.isNaN(jatuhTempo.getTime())) {
      return NextResponse.json({ message: "Jatuh tempo tidak valid" }, { status: 400 });
    }

    // If jumlah changed, recalculate status
    const newJumlah = jumlah !== undefined ? jumlah : item.jumlah;
    const statusBaru = hitungStatus(newJumlah, item.sudahDibayar);

    const updated = await db.utangPiutang.update({
      where: { id: utangPiutangId },
      data: {
        ...(jenis !== undefined && { jenis }),
        ...(namaPihak !== undefined && { namaPihak }),
        ...(tanggal !== undefined && { tanggal }),
        ...(jatuhTempo !== undefined && { jatuhTempo }),
        ...(jumlah !== undefined && { jumlah }),
        ...(catatan !== undefined && { catatan }),
        ...(buktiPath !== undefined && { buktiPath }),
        ...(jumlah !== undefined && { status: statusBaru }),
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("UTANG_PIUTANG_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const utangPiutangId = Number(id);

    if (!utangPiutangId || Number.isNaN(utangPiutangId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    const url = new URL(req.url);
    const hapusKas =
      url.searchParams.get("hapusKas") !== "false" &&
      url.searchParams.get("hapusKas") !== "0";

    const item = await db.utangPiutang.findFirst({
      where: { id: utangPiutangId, userId },
      include: {
        pembayaran: { select: { tanggal: true, jumlah: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ message: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const keteranganPencatatan =
      item.jenis === "UTANG"
        ? `Pencatatan utang dari ${item.namaPihak}`
        : `Pencatatan piutang ke ${item.namaPihak}`;

    const keteranganPembayaran =
      item.jenis === "UTANG"
        ? `Pembayaran utang ke ${item.namaPihak}`
        : `Penerimaan piutang dari ${item.namaPihak}`;

    let kasDihapus = 0;

    await db.$transaction(async (tx) => {
      if (hapusKas) {
        // Hapus kas pencatatan awal (match user + keterangan + nominal + tanggal)
        const delPencatatan = await tx.kas.deleteMany({
          where: {
            userId,
            keterangan: keteranganPencatatan,
            jumlah: item.jumlah,
            tanggal: {
              gte: startOfDay(item.tanggal),
              lte: endOfDay(item.tanggal),
            },
          },
        });
        kasDihapus += delPencatatan.count;

        // Hapus kas tiap cicilan pembayaran
        for (const p of item.pembayaran) {
          const delBayar = await tx.kas.deleteMany({
            where: {
              userId,
              keterangan: keteranganPembayaran,
              jumlah: p.jumlah,
              tanggal: {
                gte: startOfDay(p.tanggal),
                lte: endOfDay(p.tanggal),
              },
            },
          });
          kasDihapus += delBayar.count;
        }
      }

      // Cascade menghapus PembayaranUtangPiutang (onDelete: Cascade di schema)
      await tx.utangPiutang.delete({ where: { id: item.id } });
    });

    return NextResponse.json({
      ok: true,
      message: `${item.jenis} ${item.namaPihak} berhasil dihapus`,
      kasDihapus,
    });
  } catch (err: unknown) {
    console.error("UTANG_PIUTANG_DELETE error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
