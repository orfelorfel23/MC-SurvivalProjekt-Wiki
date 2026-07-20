import { prisma } from './src/server/db';
async function test() {
  try {
    const res = await prisma.item.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log("Recent Items:", res.map(r => r.nameDe + " - " + r.slug));
  } catch (e) {
    console.error(e);
  }
}
test();
