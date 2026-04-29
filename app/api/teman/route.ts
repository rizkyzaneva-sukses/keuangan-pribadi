import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await requireUser();
  const body = await req.json();
  const { namaTeman, modal, tanggalMulai, catatan } = body;

  if (!namaTeman || !modal || !tanggalMulai) {
    return new NextResponse("Required fields missing", { status: 400 });
  }

  const teman = await db.investasiTeman.create({
    data: {
      userId,
      namaTeman,
      modal: Number(modal),
      tanggalMulai: new Date(tanggalMulai),
      catatan: catatan || null,
    },
  });
  return NextResponse.json(teman);
}
