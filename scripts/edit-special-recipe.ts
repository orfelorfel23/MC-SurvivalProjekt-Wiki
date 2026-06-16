import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const recipe = await prisma.recipe.findUnique({ where: { slug: "magic-sword-recipe" } });
  
  if (recipe) {
    const grid = [
      { x: 1, y: 0, item_id: "gold_nugget" },
      { x: 1, y: 1, item_id: "nether_star", customNameDe: "Star Core", enchanted: true },
      { x: 1, y: 2, item_id: "blaze_rod" }
    ];

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        nameDe: "Göttliches Schwert",
        grid: grid,
      }
    });

    console.log("Recipe updated successfully!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
