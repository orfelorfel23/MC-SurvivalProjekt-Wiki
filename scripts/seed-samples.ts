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
      category: "weapon"
    }
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
        null, { type: "vanilla", item_id: "diamond" }, null,
        null, { type: "vanilla", item_id: "diamond" }, null,
        null, { type: "vanilla", item_id: "stick" }, null
      ],
      descriptionDe: "Dieses Rezept erfordert eine Werkbank."
    }
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
      drops: [{ item: "Netherstern", chance: "100%" }, { item: "Verzauberter Goldapfel", chance: "10%" }]
    }
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
      category: "general"
    }
  });

  // Create a world
  await prisma.world.upsert({
    where: { slug: "farmwelt" },
    update: {},
    create: {
      slug: "farmwelt",
      nameDe: "Farmwelt",
      worldType: "survival",
      descriptionDe: "Eine Welt, die alle 30 Tage zurückgesetzt wird. Ideal zum Sammeln von Ressourcen.",
      rulesDe: "Kein Griefing von aktiven Spieler-Außenposten.",
      imageUrl: "/items/grass_block.png"
    }
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
        { id: "mod-text-1", type: "text", content: "# Willkommen auf dem Server!\nDies ist ein Beispieltext für einen eigenen Reiter." }
      ]
    }
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
