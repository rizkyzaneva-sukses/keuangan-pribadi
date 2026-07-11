import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File tidak ditemukan" }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { message: "Tipe file harus gambar (jpg/png/webp/gif)" },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: "Ukuran maksimal 5MB" }, { status: 400 });
    }

    const extRaw = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "jpg";
    const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(extRaw) ? extRaw : "jpg";
    const filename = `${randomUUID()}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

    return NextResponse.json({ path: `/api/uploads/${filename}` });
  } catch (err: unknown) {
    console.error("UPLOAD error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
