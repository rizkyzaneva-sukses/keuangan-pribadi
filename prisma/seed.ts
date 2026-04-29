import { db as prisma } from "../lib/db";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  // Create user Rizky (only set password on first create, not on update)
  const hashedPassword = await bcrypt.hash("rizky123", 12);
  const user = await prisma.user.upsert({
    where: { email: "rizky@example.com" },
    update: {},
    create: {
      email: "rizky@example.com",
      passwordHash: hashedPassword,
      nama: "Rizky",
    },
  });

  console.log(`User created: ${user.email}`);

  // Create kategori kas default
  const kategoriList = ["Gaji", "Belanja", "Tabungan", "Lain-lain"];
  for (const nama of kategoriList) {
    await prisma.kategoriKas.upsert({
      where: { userId_nama: { userId: user.id, nama } },
      update: {},
      create: { userId: user.id, nama },
    });
  }

  // Create template default
  const template = await prisma.templateAlokasi.upsert({
    where: { userId_isDefault: { userId: user.id, isDefault: true } },
    update: {},
    create: {
      userId: user.id,
      nama: "Template Default Rizky",
      catatan: "Template alokasi profit default",
      isDefault: true,
    },
  });

  // Create pos alokasi default
  const posData = [
    { nama: "Aset Pasif", persentase: 20, urutan: 1 },
    { nama: "Reinvestasi Bisnis", persentase: 40, urutan: 2 },
    { nama: "Umroh Keluarga", persentase: 15, urutan: 3 },
    { nama: "Jalan-jalan Keluarga", persentase: 10, urutan: 4 },
    { nama: "Pendidikan Anak", persentase: 5, urutan: 5 },
    { nama: "Kebutuhan & Hobi Pribadi", persentase: 10, urutan: 6 },
    { nama: "Dana Darurat Keluarga", persentase: 0, urutan: 7 },
  ];

  for (const pos of posData) {
    await prisma.posAlokasi.upsert({
      where: {
        templateId_nama: { templateId: template.id, nama: pos.nama },
      },
      update: {},
      create: {
        templateId: template.id,
        nama: pos.nama,
        persentase: pos.persentase,
        urutan: pos.urutan,
      },
    });
  }

  // Create wallet pos untuk template default
  for (const pos of posData) {
    const posRecord = await prisma.posAlokasi.findFirst({
      where: { templateId: template.id, nama: pos.nama },
    });
    if (posRecord) {
      await prisma.walletPos.upsert({
        where: { posId: posRecord.id },
        update: {},
        create: {
          userId: user.id,
          posId: posRecord.id,
          saldoSaatIni: 0,
          totalMasuk: 0,
          totalKeluar: 0,
        },
      });
    }
  }

  console.log("✅ Seed data default berhasil dibuat!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
