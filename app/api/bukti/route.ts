import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type Tipe = "Deviden" | "TrxInvestasi" | "Murobahah" | "ImbalHasilDiterima";

const ALLOWED: Tipe[] = ["Deviden", "TrxInvestasi", "Murobahah", "ImbalHasilDiterima"];
const PATH_RE = /^\/api\/uploads\/[A-Za-z0-9_-]+\.[a-z]+$/i;

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await requireUser();
    const body = await req.json();
    const { tipe, id, buktiPath } = body;

    if (!ALLOWED.includes(tipe) || !id) {
      return NextResponse.json({ message: "Parameter tidak valid" }, { status: 400 });
    }

    const path = typeof buktiPath === "string" && buktiPath ? buktiPath : null;
    if (path && !PATH_RE.test(path)) {
      return NextResponse.json({ message: "Path bukti tidak valid" }, { status: 400 });
    }

    const numId = Number(id);
    switch (tipe) {
      case "Deviden": {
        const rec = await db.deviden.findFirst({ where: { id: numId, userId }, select: { id: true } });
        if (!rec) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
        await db.deviden.update({ where: { id: rec.id }, data: { buktiPath: path } });
        break;
      }
      case "TrxInvestasi": {
        const rec = await db.trxInvestasi.findFirst({ where: { id: numId, userId }, select: { id: true } });
        if (!rec) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
        await db.trxInvestasi.update({ where: { id: rec.id }, data: { buktiPath: path } });
        break;
      }
      case "Murobahah": {
        const rec = await db.murobahah.findFirst({ where: { id: numId, userId }, select: { id: true } });
        if (!rec) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
        await db.murobahah.update({ where: { id: rec.id }, data: { buktiPath: path } });
        break;
      }
      case "ImbalHasilDiterima": {
        const rec = await db.imbalHasilDiterima.findFirst({ where: { id: numId, userId }, select: { id: true } });
        if (!rec) return NextResponse.json({ message: "Tidak ditemukan" }, { status: 404 });
        await db.imbalHasilDiterima.update({ where: { id: rec.id }, data: { buktiPath: path } });
        break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("BUKTI_PATCH error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
