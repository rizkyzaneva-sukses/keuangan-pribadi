import { db } from '../lib/db';

async function main() {
  const zakat = await db.zakat.findMany({
    include: {
      pembayaran: true,
    }
  });
  console.log("Zakat records:", JSON.stringify(zakat, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
