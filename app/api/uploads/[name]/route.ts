import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  await requireUser();
  const { name } = await params;
  const clean = path.basename(name);
  if (clean !== name) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = clean.split(".").pop()?.toLowerCase() || "";
  const type = TYPES[ext];
  if (!type) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const data = await readFile(path.join(UPLOAD_DIR, clean));
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    if (ext === "pdf") {
      headers["Content-Disposition"] = "inline";
    }
    return new NextResponse(data, { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
