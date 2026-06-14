import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { KIND_TABLE } from "../lib/i18n";

// Map KIND_TABLE names to Prisma model names
const prismaModels: Record<string, keyof typeof prisma> = {
  commands: "command",
  worlds: "world",
  items: "item",
  recipes: "recipe",
  bosses: "boss",
  tasks: "task",
  shop_offers: "shopOffer",
  pets: "pet",
  wiki_pages: "wikiPage",
};

export const getKindList = createServerFn({ method: "GET" })
  .validator((d: { kindId: string }) => d)
  .handler(async ({ data }) => {
    const tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    if (!tableName) return [];

    const modelName = prismaModels[tableName] as keyof typeof prisma;
    if (!modelName) return [];

    const model = prisma[modelName] as any;

    const results = await model.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return results;
  });

export const getKindItem = createServerFn({ method: "GET" })
  .validator((d: { kindId: string; slug: string }) => d)
  .handler(async ({ data }) => {
    const tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    if (!tableName) return null;

    const modelName = prismaModels[tableName] as keyof typeof prisma;
    if (!modelName) return null;

    const model = prisma[modelName] as any;

    const item = await model.findUnique({
      where: { slug: data.slug },
    });

    if (!item) return null;

    // For specific kinds, we might need to include relations
    if (data.kindId === "rezepte") {
      const grid = Array.isArray(item.grid) ? item.grid : [];
      const ids = new Set<string>();
      grid.forEach((s: any) => s?.item_id && ids.add(s.item_id));
      if (item.resultItemId) ids.add(item.resultItemId);
      if (ids.size > 0) {
        const resolvedItems = await prisma.item.findMany({
          where: { id: { in: Array.from(ids) } },
          select: {
            id: true,
            slug: true,
            nameDe: true,
            nameEn: true,
            imageUrl: true,
            enchanted: true,
          },
        });
        (item as any)._resolvedItems = resolvedItems;
        // Also map resultItemId -> result_item_id to match old frontend expectations
        (item as any).result_item_id = item.resultItemId;
      }
    }

    if (data.kindId === "items") {
      const relatedRecipes = await prisma.recipe.findMany({
        where: {
          OR: [{ resultItemId: item.id }, { grid: { array_contains: [{ item_id: item.id }] } }],
        },
      });
      return { ...item, recipes: relatedRecipes };
    }

    if (data.kindId === "bosse" && item.spawnItemId) {
      const spawnItem = await prisma.item.findUnique({
        where: { id: item.spawnItemId },
      });
      return { ...item, spawnItem };
    }

    return item;
  });

export const searchWiki = createServerFn({ method: "GET" })
  .validator((d: { q: string }) => d)
  .handler(async ({ data }) => {
    const q = `%${data.q}%`;
    const results: any[] = await prisma.$queryRaw`
      SELECT 'befehle' as kind, slug, name_de as title, description_de as snippet, null as image_url FROM commands WHERE name_de ILIKE ${q} OR description_de ILIKE ${q}
      UNION ALL
      SELECT 'welten' as kind, slug, name_de as title, description_de as snippet, image_url FROM worlds WHERE name_de ILIKE ${q} OR description_de ILIKE ${q}
      UNION ALL
      SELECT 'items' as kind, slug, name_de as title, description_de as snippet, image_url FROM items WHERE name_de ILIKE ${q} OR description_de ILIKE ${q}
      UNION ALL
      SELECT 'rezepte' as kind, slug, name_de as title, description_de as snippet, null as image_url FROM recipes WHERE name_de ILIKE ${q}
      UNION ALL
      SELECT 'bosse' as kind, slug, name_de as title, description_de as snippet, image_url FROM bosses WHERE name_de ILIKE ${q}
      UNION ALL
      SELECT 'aufgaben' as kind, slug, name_de as title, description_de as snippet, null as image_url FROM tasks WHERE name_de ILIKE ${q} OR description_de ILIKE ${q}
      UNION ALL
      SELECT 'shop' as kind, slug, name_de as title, description_de as snippet, image_url FROM shop_offers WHERE name_de ILIKE ${q} OR description_de ILIKE ${q}
      UNION ALL
      SELECT 'pets' as kind, slug, name_de as title, description_de as snippet, image_url FROM pets WHERE name_de ILIKE ${q} OR description_de ILIKE ${q}
      UNION ALL
      SELECT 'wiki' as kind, slug, title_de as title, body_de as snippet, null as image_url FROM wiki_pages WHERE title_de ILIKE ${q} OR body_de ILIKE ${q}
      LIMIT 50;
    `;

    return results.map((r) => ({
      kind: r.kind,
      slug: r.slug,
      title: r.title,
      snippet: r.snippet?.slice(0, 100) ?? "",
      imageUrl: r.image_url,
    }));
  });

export const getUserRoles = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const roles = await prisma.userRole.findMany({
      where: { userId: data.userId },
    });
    return roles.map((r) => r.role);
  });

export const getUsersAndRoles = createServerFn({ method: "GET" }).handler(async () => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, roles: true },
  });
  return users;
});

export const grantRole = createServerFn({ method: "POST" })
  .validator((d: { userId: string; role: "ADMIN" | "EDITOR" }) => d)
  .handler(async ({ data }) => {
    return prisma.userRole.create({
      data: { userId: data.userId, role: data.role },
    });
  });

export const revokeRole = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    return prisma.userRole.delete({
      where: { id: data.id },
    });
  });
