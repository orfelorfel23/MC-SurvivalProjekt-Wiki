import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const recipe = await prisma.recipe.findUnique({ where: { slug: "magic-sword-recipe" } });

  if (recipe) {
    const grid = Array(9).fill(null);
    grid[1] = { type: "vanilla", mc_id: "gold_nugget" };
    grid[4] = { type: "vanilla", mc_id: "nether_star", name: "Star Core", enchanted: true };
    grid[7] = { type: "vanilla", mc_id: "blaze_rod" };

    await prisma.recipe.update({
      where: { id: recipe.id },
      data: {
        nameDe: "Göttliches Schwert",
        grid: grid,
      },
    });

    console.log("Recipe updated successfully!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
