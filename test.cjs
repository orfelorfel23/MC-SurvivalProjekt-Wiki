const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
prisma.world
  .findMany()
  .then((d) => console.log(JSON.stringify(d, null, 2)))
  .finally(() => prisma.$disconnect());
