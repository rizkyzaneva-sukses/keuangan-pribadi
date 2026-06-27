import { db as prisma } from "../lib/db";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  // Seed hanya jalan jika belum ada user sama sekali
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("⏭️  User sudah ada, seed dilewati.");
    return;
  }

  const email = process.env.SEED_EMAIL || "admin@example.com";
  const password = process.env.SEED_PASSWORD || "changeme123";
  const nama = process.env.SEED_NAME || "Admin";

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      nama,
    },
  });

  console.log(`✅ User default dibuat: ${user.email}`);

  // Create kategori kas default
  const kategoriList = ["Gaji", "Belanja", "Tabungan", "Transfer", "Lain-lain"];
  for (const namaKategori of kategoriList) {
    await prisma.kategoriKas.create({
      data: { userId: user.id, nama: namaKategori },
    });
  }

  // Create template default
  const template = await prisma.templateAlokasi.create({
    data: {
      userId: user.id,
      nama: "Template Default",
      catatan: "Template alokasi profit default",
      isDefault: true,
    },
  });

  // Create pos alokasi default
  const posData = [
    { nama: "Tabungan", persentase: 30, urutan: 1 },
    { nama: "Investasi", persentase: 30, urutan: 2 },
    { nama: "Sedekah/Zakat", persentase: 10, urutan: 3 },
    { nama: "Dana Darurat", persentase: 15, urutan: 4 },
    { nama: "Pribadi", persentase: 15, urutan: 5 },
  ];

  for (const pos of posData) {
    const posRecord = await prisma.posAlokasi.create({
      data: {
        templateId: template.id,
        nama: pos.nama,
        persentase: pos.persentase,
        urutan: pos.urutan,
      },
    });

    await prisma.walletPos.create({
      data: {
        userId: user.id,
        posId: posRecord.id,
        saldoSaatIni: 0,
        totalMasuk: 0,
        totalKeluar: 0,
      },
    });
  }

  console.log("✅ Seed data default berhasil dibuat!");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log("   ⚠️  Segera ganti password setelah login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
