import { db } from '../lib/db';

async function main() {
  console.log("Investasi CBU:");
  const inv = await db.investasi.findMany({
    where: {
      nama: { contains: 'CBU' }
    }
  });
  console.log(inv);
  
  console.log("Investasi Synergy/KMP:");
  const inv2 = await db.investasi.findMany({
    where: {
      OR: [
        { nama: { contains: 'Synergy' } },
        { nama: { contains: 'KMP' } }
      ]
    }
  });
  console.log(inv2);

  console.log("Murobahah CBU:");
  const mur = await db.murobahah.findMany({
     where: {
         namaPartner: { contains: 'CBU' }
     }
  });
  console.log(mur);

  console.log("Investasi Teman:");
  const teman = await db.investasiTeman.findMany();
  console.log(teman);
}

main().catch(console.error);
