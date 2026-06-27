import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, nama } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const emailNorm = String(email).toLowerCase().trim();

    // Cek email sudah terdaftar
    const existing = await db.user.findUnique({
      where: { email: emailNorm },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await db.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        nama: nama ? String(nama).trim() : null,
      },
    });

    // Auto-login setelah register
    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, nama: user.nama },
    });
  } catch (err: unknown) {
    console.error("Register error:", err);
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
