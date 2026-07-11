import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_TIPE = ["INVESTASI_TEMAN", "INVESTASI", "MUROBAHAH"] as const;
type Tipe = (typeof ALLOWED_TIPE)[number];

const DOKUMEN_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    const tipe = (form.get("tipe") as string) || "";
    const refId = Number(form.get("refId"));
    const nama = (form.get("nama") as string) || "";
    const jenis = (form.get("jenis") as string) || "LAINNYA";

    if (!ALLOWED_TIPE.includes(tipe as Tipe)) {
      return NextResponse.json({ message: "Tipe tidak valid" }, { status: 400 });
    }
    if (!refId || !nama) {
      return NextResponse.json({ message: "Nama dan referensi wajib diisi" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File tidak ditemukan" }, { status: 400 });
    }

    const extRaw = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "";
    if (!DOKUMEN_EXT[extRaw]) {
      return NextResponse.json(
        { message: "Tipe dokumen harus pdf/doc/docx/xls/xlsx/ppt/pptx/txt/csv" },
        { status: 400 },
      );
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ message: "Ukuran maksimal 20MB" }, { status: 400 });
    }

    const filename = `${randomUUID()}.${extRaw}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

    const dokumen = await db.dokumen.create({
      data: {
        userId,
        tipe,
        refId,
        nama,
        jenis,
        filePath: `/api/uploads/${filename}`,
        originalName: file.name,
        mime: file.type || DOKUMEN_EXT[extRaw],
        size: file.size,
      },
    });

    return NextResponse.json(dokumen);
  } catch (err: unknown) {
    console.error("DOKUMEN_POST error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
