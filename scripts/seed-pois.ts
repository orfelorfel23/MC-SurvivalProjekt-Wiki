import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POIS = [
  {
    slug: "netherit-farm",
    nameDe: "Netherit-Farm",
    nameEn: "Netherite Farm",
    descriptionDe: "Hier kannst du sicher Netherit farmen. Achtung, manchmal spawnen Wither-Skelette!",
    descriptionEn: "Farm Netherite safely here. Beware of Wither Skeletons!",
    x: 1200,
    y: 15,
    z: -450,
    icon: "default",
  },
  {
    slug: "ender-farm",
    nameDe: "Ender-Farm",
    nameEn: "Ender Farm",
    descriptionDe: "Die beste Farm für Enderperlen im End.",
    descriptionEn: "The best farm for Ender Pearls in the End.",
    x: -300,
    y: 64,
    z: 2000,
    icon: "default",
  },
  {
    slug: "mob-xp-farm",
    nameDe: "Mob XP-Farm",
    nameEn: "Mob XP Farm",
    descriptionDe: "Öffentliche Mob-Farm für XP. Bitte die Spawnpunkte nicht blockieren.",
    descriptionEn: "Public mob farm for XP. Please do not block the spawn points.",
    x: 450,
    y: 64,
    z: 100,
    icon: "default",
  },
  {
    slug: "spawn",
    nameDe: "Server Spawn",
    nameEn: "Server Spawn",
    descriptionDe: "Der zentrale Spawnpunkt des Servers. Hier gibt es Regeln und den Markt.",
    descriptionEn: "The central spawn point. Rules and market are here.",
    x: 0,
    y: 70,
    z: 0,
    icon: "default",
  }
];

async function main() {
  console.log("Seeding POIs...");
  for (const poi of POIS) {
    await prisma.wikiPoi.upsert({
      where: { slug: poi.slug },
      update: poi,
      create: poi,
    });
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
