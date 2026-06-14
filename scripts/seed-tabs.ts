import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const KINDS = [
  { slug: "befehle", nameDe: "Befehle", nameEn: "Commands", builtinKind: "commands" },
  { slug: "welten", nameDe: "Welten", nameEn: "Worlds", builtinKind: "worlds" },
  { slug: "items", nameDe: "Items", nameEn: "Items", builtinKind: "items" },
  { slug: "rezepte", nameDe: "Rezepte", nameEn: "Recipes", builtinKind: "recipes" },
  { slug: "bosse", nameDe: "Bosse", nameEn: "Bosses", builtinKind: "bosses" },
  { slug: "aufgaben", nameDe: "Aufgaben", nameEn: "Tasks", builtinKind: "tasks" },
  { slug: "shop", nameDe: "Shop", nameEn: "Shop", builtinKind: "shop_offers" },
  { slug: "pets", nameDe: "Pets & Mounts", nameEn: "Pets & Mounts", builtinKind: "pets" },
  { slug: "wiki", nameDe: "Wiki", nameEn: "Wiki", builtinKind: "wiki_pages" },
];

async function main() {
  const count = await prisma.wikiTab.count();
  if (count === 0) {
    console.log("Seeding wiki tabs...");
    for (let i = 0; i < KINDS.length; i++) {
      const k = KINDS[i];
      await prisma.wikiTab.create({
        data: {
          slug: k.slug,
          nameDe: k.nameDe,
          nameEn: k.nameEn,
          isBuiltin: true,
          builtinKind: k.builtinKind,
          order: i,
        },
      });
    }
    console.log("Done.");
  } else {
    console.log("Wiki tabs already seeded.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
