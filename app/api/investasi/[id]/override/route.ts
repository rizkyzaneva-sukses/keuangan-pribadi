import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const investasiId = Number(id);

    const investasi = await db.investasi.findFirst({ where: { id: investasiId, userId } });
    if (!investasi) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const assignment = await db.templateAssignment.findUnique({
      where: { investasiId },
      include: { template: { include: { pos: { orderBy: { urutan: "asc" } } } } },
    });

    let templatePos: { id: number; nama: string; persentase: number; urutan: number }[] = [];

    if (assignment) {
      templatePos = assignment.template.pos;
    } else {
      const def = await db.templateAlokasi.findFirst({
        where: { userId, isDefault: true },
        include: { pos: { orderBy: { urutan: "asc" } } },
      });
      templatePos = def?.pos ?? [];
    }

    const overrides = await db.templateOverride.findMany({
      where: { investasiId },
    });
    const overrideMap = new Map(overrides.map((o) => [o.posId, o.persentase]));

    const merged = templatePos.map((p) => ({
      posId: p.id,
      posNama: p.nama,
      urutan: p.urutan,
      defaultPersentase: p.persentase,
      overridePersentase: overrideMap.get(p.id) ?? null,
      efektifPersentase: overrideMap.get(p.id) ?? p.persentase,
    }));

    return NextResponse.json(merged);
  } catch (err: unknown) {
    console.error("OVERRIDE_GET error:", err);
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
    const investasiId = Number(id);

    const investasi = await db.investasi.findFirst({ where: { id: investasiId, userId } });
    if (!investasi) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const body = await req.json();
    const overrides: { posId: number; persentase: number }[] = body.overrides;

    if (!Array.isArray(overrides)) return NextResponse.json({ message: "Invalid body" }, { status: 400 });

    const total = overrides.reduce((s, o) => s + Number(o.persentase), 0);
    if (overrides.length > 0 && total !== 100) {
      return NextResponse.json({ message: `Total persentase override harus 100% (sekarang ${total}%)` }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.templateOverride.deleteMany({ where: { investasiId } });

      if (overrides.length > 0) {
        await tx.templateOverride.createMany({
          data: overrides.map((o) => ({
            investasiId,
            posId: Number(o.posId),
            persentase: Number(o.persentase),
          })),
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("OVERRIDE_PUT error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;
    const investasiId = Number(id);

    const investasi = await db.investasi.findFirst({ where: { id: investasiId, userId } });
    if (!investasi) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await db.templateOverride.deleteMany({ where: { investasiId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("OVERRIDE_DELETE error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
