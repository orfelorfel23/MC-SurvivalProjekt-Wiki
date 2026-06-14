import { createServerFn } from "@tanstack/react-start";
import { prisma } from "./db";
import { KIND_TABLE } from "../lib/i18n";
import * as fs from "fs";
import * as path from "path";

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
    let tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    
    // Fallback: If not a builtin kind, treat it as a dynamic wiki tab (query wiki_pages by category)
    if (!tableName) {
      const isDynamicTab = await prisma.wikiTab.findUnique({ where: { slug: data.kindId } });
      if (isDynamicTab && !isDynamicTab.isBuiltin) {
        return prisma.wikiPage.findMany({
          where: { category: data.kindId },
          orderBy: { updatedAt: "desc" },
          take: 200,
        });
      }
      return [];
    }

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
    let tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    
    if (!tableName) {
      // Dynamic wiki page logic
      const isDynamicTab = await prisma.wikiTab.findUnique({ where: { slug: data.kindId } });
      if (isDynamicTab && !isDynamicTab.isBuiltin) {
        return prisma.wikiPage.findUnique({
          where: { slug: data.slug },
        });
      }
      return null;
    }

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
      SELECT 'befehle' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, null as "imageUrl" FROM commands WHERE "nameDe" ILIKE ${q} OR "descriptionDe" ILIKE ${q}
      UNION ALL
      SELECT 'welten' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, "imageUrl" FROM worlds WHERE "nameDe" ILIKE ${q} OR "descriptionDe" ILIKE ${q}
      UNION ALL
      SELECT 'items' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, "imageUrl" FROM items WHERE "nameDe" ILIKE ${q} OR "descriptionDe" ILIKE ${q}
      UNION ALL
      SELECT 'rezepte' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, null as "imageUrl" FROM recipes WHERE "nameDe" ILIKE ${q}
      UNION ALL
      SELECT 'bosse' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, "imageUrl" FROM bosses WHERE "nameDe" ILIKE ${q}
      UNION ALL
      SELECT 'aufgaben' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, null as "imageUrl" FROM tasks WHERE "nameDe" ILIKE ${q} OR "descriptionDe" ILIKE ${q}
      UNION ALL
      SELECT 'shop' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, "imageUrl" FROM shop_offers WHERE "nameDe" ILIKE ${q} OR "descriptionDe" ILIKE ${q}
      UNION ALL
      SELECT 'pets' as kind, slug, "nameDe" as title, "descriptionDe" as snippet, "imageUrl" FROM pets WHERE "nameDe" ILIKE ${q} OR "descriptionDe" ILIKE ${q}
      UNION ALL
      SELECT 'wiki' as kind, slug, "titleDe" as title, "bodyDe" as snippet, null as "imageUrl" FROM wiki_pages WHERE "titleDe" ILIKE ${q} OR "bodyDe" ILIKE ${q}
      LIMIT 50;
    `;

    return results.map((r) => ({
      kind: r.kind,
      slug: r.slug,
      title: r.title,
      snippet: r.snippet?.slice(0, 100) ?? "",
      imageUrl: r.imageUrl,
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

export const getWikiTabs = createServerFn({ method: "GET" }).handler(async () => {
  return prisma.wikiTab.findMany({
    orderBy: { order: "asc" },
  });
});

export const getTabModulesData = createServerFn({ method: "GET" })
  .validator((d: { tabSlug: string }) => d)
  .handler(async ({ data }) => {
    const tab = await prisma.wikiTab.findUnique({ where: { slug: data.tabSlug } });
    if (!tab || tab.isBuiltin) return [];

    const modules = Array.isArray(tab.modules) ? tab.modules : [];
    
    // Hydrate modules
    const hydratedModules = await Promise.all(
      modules.map(async (mod: any) => {
        try {
          if (mod.type === "recipe" && mod.id) {
            const recipe = await prisma.recipe.findUnique({ where: { id: mod.id } });
            return { ...mod, data: recipe };
          }
          if (mod.type === "boss" && mod.id) {
            const boss = await prisma.boss.findUnique({ where: { id: mod.id } });
            return { ...mod, data: boss };
          }
          if (mod.type === "item" && mod.id) {
            const item = await prisma.item.findUnique({ where: { id: mod.id } });
            return { ...mod, data: item };
          }
          if (mod.type === "command" && mod.id) {
            const cmd = await prisma.command.findUnique({ where: { id: mod.id } });
            return { ...mod, data: cmd };
          }
        } catch (e) {
          console.error("Failed to hydrate module", mod);
        }
        return mod; // return as is (for text modules, etc)
      })
    );

    return hydratedModules;
  });

export const saveRecipe = createServerFn({ method: "POST" })
  .validator((d: { id?: string; nameDe: string; slug: string; shaped: boolean; station: string; grid: any; resultCount: number }) => d)
  .handler(async ({ data }) => {
    if (data.id && data.id !== "new") {
      return prisma.recipe.update({ where: { id: data.id }, data });
    }
    return prisma.recipe.create({ data });
  });

export const saveTab = createServerFn({ method: "POST" })
  .validator((d: { id?: string; nameDe: string; slug: string; isBuiltin: boolean; modules: any; isVisible: boolean; order: number }) => d)
  .handler(async ({ data }) => {
    if (data.id && data.id !== "new") {
      return prisma.wikiTab.update({ where: { id: data.id }, data });
    }
    return prisma.wikiTab.create({ data });
  });

export const getVanillaItems = createServerFn({ method: "GET" }).handler(async () => {
  const itemsDir = path.join(process.cwd(), "public", "items");
  if (!fs.existsSync(itemsDir)) return [];
  
  const files = fs.readdirSync(itemsDir);
  return files
    .filter(f => f.endsWith(".png"))
    .map(f => {
      const id = f.replace(".png", "");
      // Format "diamond_sword" to "Diamond Sword"
      const name = id
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return { id, name, url: `/items/${f}` };
    });
});
