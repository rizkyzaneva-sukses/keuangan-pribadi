import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { unlink } from "node:fs/promises";
import path from "node:path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const dokumenId = Number(id);

    const dok = await db.dokumen.findFirst({
      where: { id: dokumenId, userId },
      select: { id: true, filePath: true },
    });
    if (!dok) {
      return NextResponse.json({ message: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    await db.dokumen.delete({ where: { id: dok.id } });

    // Hapus file fisik (abaikan bila gagal)
    const file = dok.filePath.split("/").pop();
    if (file) {
      try {
        await unlink(path.join(process.cwd(), "uploads", file));
      } catch {
        /* file mungkin sudah tidak ada */
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DOKUMEN_DELETE error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
