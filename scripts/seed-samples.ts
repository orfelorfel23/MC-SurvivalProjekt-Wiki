import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample data...");

  // Create a custom item
  const customItem = await prisma.item.upsert({
    where: { slug: "magic-sword" },
    update: {},
    create: {
      slug: "magic-sword",
      nameDe: "Magisches Schwert",
      nameEn: "Magic Sword",
      rarity: "epic",
      descriptionDe: "Ein mystisches Schwert, das nur von den mutigsten Kriegern getragen wird.",
      imageUrl: "/items/diamond_sword.png",
      enchanted: true,
      category: "weapon",
    },
  });

  // Create a recipe
  await prisma.recipe.upsert({
    where: { slug: "magic-sword-recipe" },
    update: {},
    create: {
      slug: "magic-sword-recipe",
      nameDe: "Magisches Schwert herstellen",
      resultItemId: customItem.id,
      shaped: true,
      station: "workbench",
      grid: [
        null,
        { type: "vanilla", item_id: "diamond" },
        null,
        null,
        { type: "vanilla", item_id: "diamond" },
        null,
        null,
        { type: "vanilla", item_id: "stick" },
        null,
      ],
      descriptionDe: "Dieses Rezept erfordert eine Werkbank.",
    },
  });

  // Create a boss
  await prisma.boss.upsert({
    where: { slug: "wither-king" },
    update: {},
    create: {
      slug: "wither-king",
      nameDe: "Wither-König",
      nameEn: "Wither King",
      difficulty: "hard",
      descriptionDe: "Ein unglaublich starker Wither, der in den tiefsten Höhlen spawnt.",
      strategyDe: "Benutze Bögen aus der Ferne und vermeide direkte Nahkampfangriffe.",
      imageUrl: "/items/wither_skeleton_skull.png",
      drops: [
        { item: "Netherstern", chance: "100%" },
        { item: "Verzauberter Goldapfel", chance: "10%" },
      ],
    },
  });

  // Create a command
  await prisma.command.upsert({
    where: { slug: "spawn" },
    update: {},
    create: {
      slug: "spawn",
      nameDe: "Spawn",
      syntax: "/spawn",
      descriptionDe: "Teleportiert den Spieler sofort zum Server-Spawn.",
      category: "general",
    },
  });

  // Create a world
  await prisma.world.upsert({
    where: { slug: "farmwelt" },
    update: {},
    create: {
      slug: "farmwelt",
      nameDe: "Farmwelt",
      worldType: "survival",
      descriptionDe:
        "Eine Welt, die alle 30 Tage zurückgesetzt wird. Ideal zum Sammeln von Ressourcen.",
      rulesDe: "Kein Griefing von aktiven Spieler-Außenposten.",
      imageUrl: "/items/grass_block.png",
    },
  });

  // Create a dynamic Wiki Tab
  await prisma.wikiTab.upsert({
    where: { slug: "allgemeines" },
    update: {},
    create: {
      slug: "allgemeines",
      nameDe: "Allgemeines",
      isBuiltin: false,
      isVisible: true,
      order: 1,
      modules: [
        {
          type: "text",
          contentDe:
            "# Willkommen auf dem Server!\nDies ist ein Beispieltext für einen eigenen Reiter.",
        },
      ],
    },
  });

  // Create a Task
  await prisma.task.upsert({
    where: { slug: "holzfaeller-daily" },
    update: {},
    create: {
      slug: "holzfaeller-daily",
      nameDe: "Holzfäller (Täglich)",
      nameEn: "Lumberjack (Daily)",
      descriptionDe: "Fälle 100 Eichenstämme im Wald.",
      frequency: "daily",
      rewardAmount: 500,
      rewardCurrency: "Coins",
      rewardExtraDe: "1x Verzauberter Apfel",
      category: "farming",
    },
  });

  // Create a ShopOffer
  await prisma.shopOffer.upsert({
    where: { slug: "diamant-kaufen" },
    update: {},
    create: {
      slug: "diamant-kaufen",
      nameDe: "Diamant",
      price: 150,
      currency: "Coins",
      descriptionDe: "Kaufe einen wertvollen Diamanten im Admin-Shop.",
      imageUrl: "/items/diamond.png",
      category: "materials",
    },
  });

  // Create a Pet
  await prisma.pet.upsert({
    where: { slug: "drache-pet" },
    update: {},
    create: {
      slug: "drache-pet",
      nameDe: "Kleiner Drache",
      kind: "pet",
      source: "Legendary Crate",
      descriptionDe: "Ein feuriger kleiner Begleiter, der dir im Kampf hilft.",
      skillsDe: "Gibt dir dauerhaft Feuerresistenz I.",
      imageUrl: "/items/dragon_egg.png",
      acquireDe: "Kann mit einer 1% Chance aus der legendären Kiste gezogen werden.",
    },
  });

  // Create a WikiPage (for the Allgemeines Tab or other uses)
  await prisma.wikiPage.upsert({
    where: { slug: "server-regeln" },
    update: {},
    create: {
      slug: "server-regeln",
      titleDe: "Server Regeln",
      bodyDe:
        "1. Kein Griefing\n2. Kein Spam\n3. Respektiert das Team\n\nVerstöße führen zu einem permanenten Bann.",
      category: "allgemeines",
    },
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
