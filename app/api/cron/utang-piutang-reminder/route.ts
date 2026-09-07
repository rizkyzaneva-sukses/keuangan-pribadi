import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET = process.env.CRON_SECRET || "";

async function sendTelegram(text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Telegram error: ${json.description}`);
  return json;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function diffDays(a: Date, b: Date) {
  const msPerDay = 86400000;
  return Math.ceil((a.getTime() - b.getTime()) / msPerDay);
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const in7Days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59, 59);

    // Cari utang/piutang yang:
    // - jatuh tempo <= 7 hari dari sekarang (termasuk overdue)
    // - status belum LUNAS
    const items = await db.utangPiutang.findMany({
      where: {
        status: { in: ["BELUM", "SEBAGIAN"] },
        jatuhTempo: { not: null, lte: in7Days },
      },
      select: {
        id: true,
        jenis: true,
        namaPihak: true,
        jumlah: true,
        sudahDibayar: true,
        jatuhTempo: true,
      },
    });

    if (items.length === 0) {
      return NextResponse.json({ message: "Tidak ada utang/piutang perlu reminder.", count: 0 });
    }

    let count = 0;

    for (const item of items) {
      const sisa = item.jumlah - item.sudahDibayar;
      const jt = new Date(item.jatuhTempo!);
      const tgl = jt.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      let urgency: string;
      let icon: string;
      const daysLeft = diffDays(jt, startOfToday);

      if (daysLeft < 0) {
        // Overdue
        urgency = `🔴 <b>OVERDUE ${Math.abs(daysLeft)} HARI!</b>`;
        icon = "🚨";
      } else if (daysLeft === 0) {
        // Hari ini
        urgency = "⚠️ <b>JATUH TEMPO HARI INI!</b>";
        icon = "⏰";
      } else if (daysLeft <= 3) {
        // 1-3 hari lagi
        urgency = `⚠️ <b>JATUH TEMPO ${daysLeft} HARI LAGI</b>`;
        icon = "⏰";
      } else {
        // 4-7 hari lagi
        urgency = `📋 <b>Jatuh tempo ${daysLeft} hari lagi</b>`;
        icon = "📌";
      }

      const jenisLabel = item.jenis === "UTANG" ? "Utang" : "Piutang";

      const text = [
        `${icon} ${urgency}`,
        ``,
        `📄 <b>${jenisLabel}</b> — ${item.namaPihak}`,
        `💰 <b>Sisa Tagihan:</b> ${formatRupiah(sisa)}`,
        `📅 <b>Jatuh Tempo:</b> ${tgl}`,
        ``,
        `Buka Finance Pribadi untuk detail →`,
      ]
        .filter(Boolean)
        .join("\n");

      await sendTelegram(text);
      count++;
    }

    return NextResponse.json({
      message: `Berhasil kirim ${count} reminder utang/piutang.`,
      count,
    });
  } catch (err: unknown) {
    console.error("CRON_UTANG_PIUTANG_REMINDER error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
