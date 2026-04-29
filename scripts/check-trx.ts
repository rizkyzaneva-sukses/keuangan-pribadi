import { db } from '../lib/db';

async function main() {
  const cbu = await db.investasi.findUnique({
    where: { id: 2 },
    include: { transaksi: true }
  });
  console.log("CBU:", cbu);

  const kmp = await db.investasi.findUnique({
    where: { id: 1 },
    include: { transaksi: true }
  });
  console.log("KMP:", kmp);

  const synergy = await db.investasi.findUnique({
    where: { id: 4 },
    include: { transaksi: true }
  });
  console.log("Synergy:", synergy);
}

main().catch(console.error);
