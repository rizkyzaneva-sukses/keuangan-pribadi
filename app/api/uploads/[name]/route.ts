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
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
