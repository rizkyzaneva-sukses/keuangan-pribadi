import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type PosPayload = {
  id?: number;
  nama: string;
  persentase: number;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const templateId = Number(id);

    const template = await db.templateAlokasi.findFirst({
      where: { id: templateId, userId },
      include: { pos: { orderBy: { urutan: "asc" }, include: { walletPos: true, alokasiLog: true } } },
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    const body = await req.json();
    const nama = String(body.nama || "").trim();
    const catatan = body.catatan ? String(body.catatan).trim() : "";
    const isDefault = Boolean(body.isDefault);
    const pos = body.pos as PosPayload[];

    if (!nama || !Array.isArray(pos) || pos.length === 0) {
      return NextResponse.json({ message: "Nama & pos required" }, { status: 400 });
    }

    const total = pos.reduce((sum, item) => sum + Number(item.persentase || 0), 0);
    if (total !== 100) {
      return NextResponse.json({ message: "Total persentase harus 100%" }, { status: 400 });
    }

    const names = pos.map((item) => String(item.nama || "").trim()).filter(Boolean);
    if (names.length !== pos.length) {
      return NextResponse.json({ message: "Semua pos harus memiliki nama" }, { status: 400 });
    }
    if (new Set(names).size !== names.length) {
      return NextResponse.json({ message: "Nama pos dalam satu template tidak boleh sama" }, { status: 400 });
    }

    const existingById = new Map(template.pos.map((item) => [item.id, item]));
    for (const item of pos) {
      if (item.id && !existingById.has(Number(item.id))) {
        return NextResponse.json({ message: "Ada pos yang tidak valid untuk template ini" }, { status: 400 });
      }
    }

    const incomingIds = new Set(pos.filter((item) => item.id).map((item) => Number(item.id)));
    const removed = template.pos.filter((item) => !incomingIds.has(item.id));
    const blocked = removed.filter((item) => {
      const wallet = item.walletPos;
      return (
        item.alokasiLog.length > 0 ||
        (Boolean(wallet) &&
          (wallet!.saldoSaatIni !== 0 ||
            wallet!.totalMasuk !== 0 ||
            wallet!.totalKeluar !== 0))
      );
    });

    if (blocked.length > 0) {
      const blockedNames = blocked.map((item) => item.nama).join(", ");
      return NextResponse.json(
        { message: `Pos "${blockedNames}" sudah dipakai dan tidak bisa dihapus. Set persentase 0% jika ingin menghentikan penggunaannya.` },
        { status: 400 }
      );
    }

    await db.$transaction(async (tx) => {
      for (const item of removed) {
        await tx.posAlokasi.delete({ where: { id: item.id } });
      }

      if (isDefault) {
        await tx.templateAlokasi.updateMany({
          where: { userId, isDefault: true, id: { not: templateId } },
          data: { isDefault: false },
        });
      }

      await tx.templateAlokasi.update({
        where: { id: templateId },
        data: {
          nama,
          catatan: catatan || null,
          isDefault,
        },
      });

      for (let index = 0; index < pos.length; index += 1) {
        const item = pos[index];
        const namaPos = String(item.nama).trim();
        const persentase = Number(item.persentase);

        if (item.id) {
          await tx.posAlokasi.update({
            where: { id: Number(item.id) },
            data: {
              nama: namaPos,
              persentase,
              urutan: index + 1,
            },
          });
          continue;
        }

        const created = await tx.posAlokasi.create({
          data: {
            templateId,
            nama: namaPos,
            persentase,
            urutan: index + 1,
          },
        });

        await tx.walletPos.upsert({
          where: { posId: created.id },
          update: {},
          create: {
            userId,
            posId: created.id,
            saldoSaatIni: 0,
            totalMasuk: 0,
            totalKeluar: 0,
          },
        });
      }
    });

    const updated = await db.templateAlokasi.findUnique({
      where: { id: templateId },
      include: { pos: { orderBy: { urutan: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("TEMPLATES_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const templateId = Number(id);

    const template = await db.templateAlokasi.findFirst({
      where: { id: templateId, userId },
      select: { id: true, isDefault: true, archivedAt: true },
    });

    if (!template) {
      return NextResponse.json({ message: "Template not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const archived = body.archived === undefined ? template.archivedAt === null : Boolean(body.archived);

    await db.templateAlokasi.update({
      where: { id: templateId },
      data: {
        archivedAt: archived ? new Date() : null,
      },
    });

    const updated = await db.templateAlokasi.findUnique({
      where: { id: templateId },
      include: { pos: { orderBy: { urutan: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("TEMPLATES_PATCH error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
