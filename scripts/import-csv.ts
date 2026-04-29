import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const db = new PrismaClient({ adapter });

// ─── Data dari transaksi_2026-04-28.csv ───
const csvData = [
  { tanggal: "2026-04-11", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 15230000, total: 15230000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2026-03-10", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 10000000, total: 10000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "+ 500rb (udunan THR asana)" },
  { tanggal: "2026-02-11", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 16000000, total: 16000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2026-01-11", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 11627743, total: 11627743, metodeBayar: "Transfer Bank", akun: "BCA", catatan: "" },
  { tanggal: "2026-01-11", investasi: "CBU TANGERANG", partner: "CBU Tangerang", arah: "IN", kategori: "IN_CAPITAL_RETURN_PLUS_PROFIT", principal: 52913000, profit: 5287000, total: 58200000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2026-01-10", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 15000000, total: 15000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2026-01-06", investasi: "ELYASR", partner: "ANNISA", arah: "OUT", kategori: "OUT_BUSINESS_CAPITAL", principal: 52150000, profit: 0, total: 52150000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2026-01-01", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "OUT", kategori: "OUT_BUSINESS_CAPITAL", principal: 251000000, profit: 0, total: 251000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2026-01-01", investasi: "ELYASR", partner: "ANNISA", arah: "OUT", kategori: "OUT_TOPUP_CAPITAL", principal: 9000000, profit: 0, total: 9000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "GAJIAN" },
  { tanggal: "2025-12-10", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 15000000, total: 15000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2025-12-01", investasi: "ELYASR", partner: "ANNISA", arah: "OUT", kategori: "OUT_TOPUP_CAPITAL", principal: 9000000, profit: 0, total: 9000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2025-11-25", investasi: "Synergy Manufacture", partner: "Iyan & Nurdin", arah: "OUT", kategori: "OUT_TOPUP_CAPITAL", principal: 20000000, profit: 0, total: 20000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "2x Tf (15jt dan 5jt)" },
  { tanggal: "2025-11-10", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 15000000, total: 15000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2025-10-18", investasi: "Synergy Manufacture", partner: "Iyan & Nurdin", arah: "OUT", kategori: "OUT_BUSINESS_CAPITAL", principal: 25000000, profit: 0, total: 25000000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "Beli Mesin Lubang + Kancing" },
  { tanggal: "2025-10-10", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 15000000, total: 15000000, metodeBayar: "Transfer", akun: "BCA", catatan: "" },
  { tanggal: "2025-10-10", investasi: "CBU TANGERANG", partner: "CBU Tangerang", arah: "OUT", kategori: "OUT_BUSINESS_CAPITAL", principal: 52913000, profit: 0, total: 52913000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2025-10-04", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 5287000, total: 5287000, metodeBayar: "Transfer", akun: "BCA - RIZKY", catatan: "" },
  { tanggal: "2025-10-01", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 5294631, total: 5294631, metodeBayar: "Transfer", akun: "BCA", catatan: "" },
  { tanggal: "2025-09-01", investasi: "ELYASR", partner: "ANNISA", arah: "OUT", kategori: "OUT_BUSINESS_CAPITAL", principal: 9000000, profit: 0, total: 9000000, metodeBayar: "Transfer", akun: "BCA", catatan: "" },
  { tanggal: "2025-08-27", investasi: "FAUZAN MANUFACTURE", partner: "FAUZAN", arah: "OUT", kategori: "OUT_BUSINESS_CAPITAL", principal: 5000000, profit: 0, total: 5000000, metodeBayar: "Transfer Bank", akun: "BCA Fauzan", catatan: "" },
  { tanggal: "2025-06-16", investasi: "KMP (Cimol Bojot)", partner: "HIS", arah: "IN", kategori: "IN_DIVIDEND", principal: 0, profit: 3000000, total: 3000000, metodeBayar: "Transfer Bank", akun: "BCA", catatan: "" },
];

// Mapping nama investasi dari CSV ke nama di DB (adjust jika perlu)
const investasiNameMap: Record<string, string> = {
  "KMP (Cimol Bojot)": "KMP (Cimol Bojot)",
  "CBU TANGERANG": "CBU TANGERANG",
  "ELYASR": "ELYASR",
  "Synergy Manufacture": "Synergy Manufacture",
  "FAUZAN MANUFACTURE": "FAUZAN MANUFACTURE",
};

async function main() {
  // 1. Ambil user pertama (atau sesuaikan jika multi-user)
  const user = await db.user.findFirst();
  if (!user) throw new Error("Tidak ada user ditemukan! Pastikan sudah ada user di DB.");
  console.log(`✅ User ditemukan: ${user.email} (id=${user.id})`);

  // 2. Ambil semua investasi milik user
  const existingInvestasi = await db.investasi.findMany({
    where: { userId: user.id },
    select: { id: true, nama: true, partner: true },
  });
  console.log(`📋 Investasi existing (${existingInvestasi.length}):`, existingInvestasi.map(i => `${i.id}: ${i.nama}`));

  // 3. Buat map nama → id, auto-create jika belum ada
  const investasiMap = new Map<string, number>();
  for (const inv of existingInvestasi) {
    investasiMap.set(inv.nama, inv.id);
  }

  // 4. Pastikan semua investasi dari CSV ada di DB
  const uniqueInvestasi = new Map<string, string>(); // nama → partner
  for (const row of csvData) {
    if (!uniqueInvestasi.has(row.investasi)) {
      uniqueInvestasi.set(row.investasi, row.partner);
    }
  }

  for (const [nama, partner] of uniqueInvestasi) {
    if (!investasiMap.has(nama)) {
      console.log(`➕ Membuat investasi baru: "${nama}" (partner: ${partner})`);
      const newInv = await db.investasi.create({
        data: {
          userId: user.id,
          nama,
          partner,
          tipe: "BISNIS",
          status: "ACTIVE",
        },
      });
      investasiMap.set(nama, newInv.id);
      console.log(`   → Created id=${newInv.id}`);
    }
  }

  // 5. Insert semua transaksi
  let inserted = 0;
  let skipped = 0;

  for (const row of csvData) {
    const investasiId = investasiMap.get(row.investasi);
    if (!investasiId) {
      console.log(`⚠️  Investasi tidak ditemukan: "${row.investasi}" — SKIP`);
      skipped++;
      continue;
    }

    // Cek duplikat (tanggal + investasiId + total + arah)
    const existing = await db.trxInvestasi.findFirst({
      where: {
        userId: user.id,
        investasiId,
        tanggal: new Date(row.tanggal),
        arah: row.arah as "IN" | "OUT",
        total: row.total,
      },
    });

    if (existing) {
      console.log(`⏭️  Duplikat ditemukan, skip: ${row.tanggal} ${row.investasi} ${row.arah} ${row.total}`);
      skipped++;
      continue;
    }

    await db.trxInvestasi.create({
      data: {
        userId: user.id,
        investasiId,
        tanggal: new Date(row.tanggal),
        arah: row.arah as "IN" | "OUT",
        kategori: row.kategori as any,
        principal: row.principal,
        profit: row.profit,
        total: row.total,
        metodeBayar: row.metodeBayar || null,
        akun: row.akun || null,
        catatan: row.catatan || null,
      },
    });

    console.log(`✅ Insert: ${row.tanggal} | ${row.investasi} | ${row.arah} | ${row.kategori} | Rp${row.total.toLocaleString("id-ID")}`);
    inserted++;
  }

  console.log(`\n🎉 Selesai! Inserted: ${inserted}, Skipped: ${skipped}`);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => db.$disconnect());
