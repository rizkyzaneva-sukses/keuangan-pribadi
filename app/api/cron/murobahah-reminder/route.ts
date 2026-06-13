import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  // Validasi secret biar endpoint gak bisa dipanggil sembarangan
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Cari murobahah yang jatuh tempo HARI INI dan masih AKTIF
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const dueToday = await db.murobahah.findMany({
      where: {
        status: "AKTIF",
        jatuhTempo: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        namaPartner: true,
        pokok: true,
        totalImbalHasil: true,
        jatuhTempo: true,
        catatan: true,
      },
    });

    if (dueToday.length === 0) {
      return NextResponse.json({ message: "Tidak ada murobahah jatuh tempo hari ini.", count: 0 });
    }

    // Kirim notifikasi per item
    for (const m of dueToday) {
      const total = m.pokok + m.totalImbalHasil;
      const tgl = new Date(m.jatuhTempo).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const text = [
        `⚠️ <b>JATUH TEMPO MUROBAHAH HARI INI!</b>`,
        ``,
        `👤 <b>Partner:</b> ${m.namaPartner}`,
        `💰 <b>Pokok:</b> ${formatRupiah(m.pokok)}`,
        `📈 <b>Imbal Hasil:</b> ${formatRupiah(m.totalImbalHasil)}`,
        `💵 <b>Total Tagihan:</b> ${formatRupiah(total)}`,
        `📅 <b>Jatuh Tempo:</b> ${tgl}`,
        m.catatan ? `📝 <b>Catatan:</b> ${m.catatan}` : "",
        ``,
        `Segera konfirmasi pembayaran di Finance Pribadi.`,
      ]
        .filter(Boolean)
        .join("\n");

      await sendTelegram(text);
    }

    return NextResponse.json({
      message: `Berhasil kirim ${dueToday.length} notifikasi.`,
      count: dueToday.length,
    });
  } catch (err: unknown) {
    console.error("CRON_MUROBAHAH_REMINDER error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ message }, { status: 500 });
  }
}
