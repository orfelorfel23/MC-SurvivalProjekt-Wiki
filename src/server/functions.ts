import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { prisma } from "./db";
import { KIND_TABLE } from "../lib/i18n";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Auth helpers (direct DB lookup to avoid better-auth Zod v4 incompatibility)
// ---------------------------------------------------------------------------
async function getSessionFromRequest() {
  try {
    const request = getRequest();
    const cookieHeader = request?.headers?.get("cookie") ?? "";
    // better-auth stores session token in cookie named "better-auth.session_token"
    const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    // The token is "sessionId.userId" — look up by token in the session table
    const session = await (prisma as any).session.findFirst({
      where: { token },
      include: { user: true },
    });
    return session ?? null;
  } catch {
    return null;
  }
}

async function requireRole(...roles: ("ADMIN" | "MODERATOR" | "EDITOR")[]) {
  const session = await getSessionFromRequest();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
  });
  const roleSet = new Set(userRoles.map((r) => r.role));
  if (!roles.some((r) => roleSet.has(r))) throw new Error("FORBIDDEN");
  return session;
}

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
          where: { category: data.kindId, deletedAt: null },
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
      where: { deletedAt: null },
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
        return prisma.wikiPage.findFirst({
          where: { slug: data.slug, deletedAt: null },
        });
      }
      return null;
    }

    const modelName = prismaModels[tableName] as keyof typeof prisma;
    if (!modelName) return null;

    const model = prisma[modelName] as any;

    const item = await model.findFirst({
      where: { slug: data.slug, deletedAt: null },
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
          deletedAt: null,
        },
      });
      return { ...item, recipes: relatedRecipes };
    }

    if (data.kindId === "bosse" && item.spawnItemId) {
      const spawnItem = await prisma.item.findFirst({
        where: { id: item.spawnItemId, deletedAt: null },
      });
      return { ...item, spawnItem };
    }

    return item;
  });

import Fuse from "fuse.js";

let searchCache: any[] = [];
let searchCacheTime = 0;
let searchCacheLock = false;

export const searchWiki = createServerFn({ method: "GET" })
  .validator((d: { q: string; category?: string; rarity?: string }) => d)
  .handler(async ({ data }) => {
    // Refresh cache if older than 30 seconds (with simple lock to avoid stampede)
    if (Date.now() - searchCacheTime > 30000 && !searchCacheLock) {
      searchCacheLock = true;
      const commands = await prisma.command.findMany({ where: { deletedAt: null } });
      const worlds = await prisma.world.findMany({ where: { deletedAt: null } });
      const items = await prisma.item.findMany({ where: { deletedAt: null } });
      const recipes = await prisma.recipe.findMany({ where: { deletedAt: null } });
      const bosses = await prisma.boss.findMany({ where: { deletedAt: null } });
      const tasks = await prisma.task.findMany({ where: { deletedAt: null } });
      const shops = await prisma.shopOffer.findMany({ where: { deletedAt: null } });
      const pets = await prisma.pet.findMany({ where: { deletedAt: null } });
      const pages = await prisma.wikiPage.findMany({ where: { deletedAt: null } });

      searchCache = [
        ...commands.map((c) => ({
          kind: "befehle",
          slug: c.slug,
          title: c.nameDe,
          snippet: c.descriptionDe,
          imageUrl: null,
          category: c.category,
          aliases: [],
        })),
        ...worlds.map((w) => ({
          kind: "welten",
          slug: w.slug,
          title: w.nameDe,
          snippet: w.descriptionDe,
          imageUrl: w.imageUrl,
          category: null,
          aliases: [],
        })),
        ...items.map((i) => ({
          kind: "items",
          slug: i.slug,
          title: i.nameDe,
          snippet: i.descriptionDe,
          imageUrl: i.imageUrl,
          category: i.category,
          rarity: i.rarity,
          aliases: i.aliases,
        })),
        ...recipes.map((r) => ({
          kind: "rezepte",
          slug: r.slug,
          title: r.nameDe,
          snippet: r.descriptionDe,
          imageUrl: null,
          category: null,
          aliases: r.aliases,
        })),
        ...bosses.map((b) => ({
          kind: "bosse",
          slug: b.slug,
          title: b.nameDe,
          snippet: b.descriptionDe,
          imageUrl: b.imageUrl,
          category: null,
          aliases: [],
        })),
        ...tasks.map((t) => ({
          kind: "aufgaben",
          slug: t.slug,
          title: t.nameDe,
          snippet: t.descriptionDe,
          imageUrl: null,
          category: t.category,
          aliases: [],
        })),
        ...shops.map((s) => ({
          kind: "shop",
          slug: s.slug,
          title: s.nameDe,
          snippet: s.descriptionDe,
          imageUrl: s.imageUrl,
          category: s.category,
          aliases: [],
        })),
        ...pets.map((p) => ({
          kind: "pets",
          slug: p.slug,
          title: p.nameDe,
          snippet: p.descriptionDe,
          imageUrl: p.imageUrl,
          category: null,
          aliases: [],
        })),
        ...pages.map((p) => ({
          kind: "wiki",
          slug: p.slug,
          title: p.titleDe,
          snippet: p.bodyDe,
          imageUrl: null,
          category: p.category,
          aliases: p.aliases,
        })),
      ];
      searchCacheTime = Date.now();
      searchCacheLock = false;
    }

    let itemsToSearch = searchCache;
    if (data.category) itemsToSearch = itemsToSearch.filter((i) => i.category === data.category);
    if (data.rarity) itemsToSearch = itemsToSearch.filter((i) => i.rarity === data.rarity);

    if (!data.q)
      return itemsToSearch.slice(0, 50).map((r) => ({
        kind: r.kind,
        slug: r.slug,
        title: r.title,
        snippet: r.snippet?.slice(0, 100) ?? "",
        imageUrl: r.imageUrl,
      }));

    const fuse = new Fuse(itemsToSearch, {
      keys: ["title", "aliases", "snippet"],
      threshold: 0.3,
    });

    return fuse
      .search(data.q)
      .map((result) => ({
        kind: result.item.kind,
        slug: result.item.slug,
        title: result.item.title,
        snippet: result.item.snippet?.slice(0, 100) ?? "",
        imageUrl: result.item.imageUrl,
      }))
      .slice(0, 50);
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
  await requireRole("ADMIN");
  const users = await prisma.user.findMany({
    select: { id: true, name: true, roles: true },
  });
  return users;
});

export const grantRole = createServerFn({ method: "POST" })
  .validator((d: { userId: string; role: "ADMIN" | "EDITOR" | "MODERATOR" }) => d)
  .handler(async ({ data }) => {
    await requireRole("ADMIN");
    return prisma.userRole.create({
      data: { userId: data.userId, role: data.role },
    });
  });

export const revokeRole = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    await requireRole("ADMIN");
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
            const recipe = await prisma.recipe.findFirst({
              where: { id: mod.id, deletedAt: null },
            });
            return { ...mod, data: recipe };
          }
          if (mod.type === "boss" && mod.id) {
            const boss = await prisma.boss.findFirst({ where: { id: mod.id, deletedAt: null } });
            return { ...mod, data: boss };
          }
          if (mod.type === "item" && mod.id) {
            const item = await prisma.item.findFirst({ where: { id: mod.id, deletedAt: null } });
            return { ...mod, data: item };
          }
          if (mod.type === "command" && mod.id) {
            const cmd = await prisma.command.findFirst({ where: { id: mod.id, deletedAt: null } });
            return { ...mod, data: cmd };
          }
        } catch (e) {
          console.error("Failed to hydrate module", mod);
        }
        return mod; // return as is (for text modules, etc)
      }),
    );

    return hydratedModules;
  });

export const saveRecipe = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id?: string;
      nameDe: string;
      slug: string;
      shaped: boolean;
      station: string;
      grid: any;
      resultCount: number;
      resultItem?: any;
    }) => d,
  )
  .handler(async ({ data }) => {
    await requireRole("ADMIN", "MODERATOR", "EDITOR");
    let resultItemId = null;

    // If we received a resultItem, we either link it to DB or create a new Item!
    if (data.resultItem) {
      if (data.resultItem.type === "db") {
        resultItemId = data.resultItem.item_id;
      } else if (data.resultItem.type === "vanilla") {
        // Find if this vanilla custom item already exists
        let customItem = await prisma.item.findFirst({
          where: { nameDe: data.resultItem.name, oraxenId: data.resultItem.mc_id },
        });
        if (!customItem) {
          customItem = await prisma.item.create({
            data: {
              slug: data.slug + "-result",
              nameDe: data.resultItem.name,
              oraxenId: data.resultItem.mc_id,
              imageUrl: `/item-icons/${data.resultItem.mc_id}.png`,
              enchanted: data.resultItem.enchanted || false,
            },
          });
        }
        resultItemId = customItem.id;
      }
    }

    const existingRecipes = await prisma.recipe.findMany({
      where: {
        station: data.station,
        shaped: data.shaped,
        deletedAt: null,
      },
    });

    const isDuplicate = existingRecipes.some(
      (r) => r.id !== data.id && JSON.stringify(r.grid) === JSON.stringify(data.grid),
    );

    if (isDuplicate) {
      throw new Error("DUPLICATE_RECIPE");
    }

    const recipeData = {
      nameDe: data.nameDe,
      slug: data.slug,
      shaped: data.shaped,
      station: data.station,
      grid: data.grid,
      resultCount: data.resultCount,
      resultItemId: resultItemId,
    };

    if (data.id && data.id !== "new") {
      return prisma.recipe.update({ where: { id: data.id }, data: recipeData });
    }
    return prisma.recipe.create({ data: recipeData });
  });

export const saveTab = createServerFn({ method: "POST" })
  .validator(
    (d: {
      id?: string;
      nameDe: string;
      slug: string;
      isBuiltin: boolean;
      modules: any;
      isVisible: boolean;
      order: number;
    }) => d,
  )
  .handler(async ({ data }) => {
    await requireRole("ADMIN", "EDITOR");
    const { id, ...createData } = data;
    if (id && id !== "new") {
      // Strip id from the update payload — only use it as a WHERE key
      return prisma.wikiTab.update({ where: { id }, data: createData });
    }
    return prisma.wikiTab.create({ data: createData });
  });

export const saveGenericEntity = createServerFn({ method: "POST" })
  .validator((d: { kindId: string; slug: string; data: any }) => d)
  .handler(async ({ data }) => {
    await requireRole("ADMIN", "MODERATOR", "EDITOR");
    let tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    let modelName = prismaModels[tableName] as keyof typeof prisma;

    if (!modelName) {
      // dynamic wiki page
      modelName = "wikiPage" as keyof typeof prisma;
    }

    const model = prisma[modelName] as any;
    return model.update({
      where: { slug: data.slug },
      data: data.data,
    });
  });

export const getVanillaItems = createServerFn({ method: "GET" }).handler(async () => {
  const itemsDir = path.join(process.cwd(), "public", "item-icons");
  if (!fs.existsSync(itemsDir)) return [];

  const files = fs.readdirSync(itemsDir);
  return files
    .filter((f) => f.endsWith(".png"))
    .map((f) => {
      const id = f.replace(".png", "");
      // Format "diamond_sword" to "Diamond Sword"
      const name = id
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return { id, name, url: `/item-icons/${f}` };
    });
});

export const uploadImageFn = createServerFn({ method: "POST" })
  .validator((d: FormData) => d)
  .handler(async ({ data }) => {
    const file = data.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || ".png";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return { url: `/uploads/${filename}` };
  });

export const softDeleteGenericEntity = createServerFn({ method: "POST" })
  .validator((d: { kindId: string; slug: string }) => d)
  .handler(async ({ data }) => {
    await requireRole("ADMIN", "MODERATOR", "EDITOR");
    let tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    let modelName = prismaModels[tableName] as keyof typeof prisma;

    if (!modelName) {
      modelName = "wikiPage" as keyof typeof prisma;
    }

    const model = prisma[modelName] as any;
    return model.update({
      where: { slug: data.slug },
      data: { deletedAt: new Date() },
    });
  });

export const getDeletedItems = createServerFn({ method: "GET" }).handler(async () => {
  await requireRole("ADMIN", "MODERATOR");
  // Only show items deleted within the last 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const results = [];

  for (const [kind, table] of Object.entries(KIND_TABLE)) {
    const modelName = prismaModels[table] as keyof typeof prisma;
    if (!modelName) continue;
    const model = prisma[modelName] as any;
    const deleted = await model.findMany({ where: { deletedAt: { not: null, gte: cutoff } } });
    results.push(...deleted.map((d: any) => ({ ...d, _kind: kind })));
  }

  // Also check wikiPages not in KIND_TABLE
  const deletedPages = await prisma.wikiPage.findMany({
    where: { deletedAt: { not: null, gte: cutoff } },
  });
  results.push(...deletedPages.map((d: any) => ({ ...d, _kind: d.category })));

  // Deduplicate by id just in case
  const unique = Array.from(new Map(results.map((item) => [item.id, item])).values());

  return unique.sort(
    (a: any, b: any) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
  );
});

export const restoreItem = createServerFn({ method: "POST" })
  .validator((d: { kindId: string; id: string }) => d)
  .handler(async ({ data }) => {
    await requireRole("ADMIN", "MODERATOR");
    let tableName = KIND_TABLE[data.kindId as keyof typeof KIND_TABLE];
    let modelName = prismaModels[tableName] as keyof typeof prisma;

    if (!modelName) {
      modelName = "wikiPage" as keyof typeof prisma;
    }

    const model = prisma[modelName] as any;
    return model.update({
      where: { id: data.id },
      data: { deletedAt: null },
    });
  });

export const getComments = createServerFn({ method: "GET" })
  .validator((d: { recipeId: string }) => d)
  .handler(async ({ data }) => {
    return prisma.comment.findMany({
      where: { recipeId: data.recipeId, deletedAt: null },
      include: { author: { select: { id: true, name: true, image: true, roles: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

export const postComment = createServerFn({ method: "POST" })
  .validator((d: { recipeId: string; content: string; authorId: string }) => d)
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session?.user) throw new Error("UNAUTHORIZED");
    return prisma.comment.create({
      data: {
        content: data.content,
        recipeId: data.recipeId,
        authorId: session.user.id,
      },
    });
  });

export const deleteComment = createServerFn({ method: "POST" })
  .validator((d: { commentId: string }) => d)
  .handler(async ({ data }) => {
    const session = await getSessionFromRequest();
    if (!session?.user) throw new Error("UNAUTHORIZED");
    const comment = await prisma.comment.findUnique({ where: { id: data.commentId } });
    if (!comment) throw new Error("NOT_FOUND");
    if (comment.authorId !== session.user.id) {
      await requireRole("ADMIN", "MODERATOR");
    }
    return prisma.comment.update({
      where: { id: data.commentId },
      data: { deletedAt: new Date() },
    });
  });

export const checkBrokenLinks = createServerFn({ method: "POST" }).handler(async () => {
  const results: { location: string; text: string; link: string; valid: boolean }[] = [];

  // Helper to find links in markdown text
  const extractLinks = (text: string | null | undefined, location: string) => {
    if (!text) return;
    const regex = /\[([^\]]+)\]\((\/[^\)]+)\)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({ location, text: match[1], link: match[2], valid: false });
    }
  };

  // 1. Fetch all Items
  const items = await prisma.item.findMany({ where: { deletedAt: null } });
  items.forEach((i) => {
    extractLinks(i.descriptionDe, `Item: ${i.nameDe}`);
    extractLinks(i.descriptionEn, `Item: ${i.nameDe}`);
  });

  // 2. Fetch all Recipes
  const recipes = await prisma.recipe.findMany({ where: { deletedAt: null } });
  recipes.forEach((r) => {
    extractLinks(r.descriptionDe, `Recipe: ${r.nameDe}`);
    extractLinks(r.descriptionEn, `Recipe: ${r.nameDe}`);
  });

  // 3. Fetch all Bosses
  const bosses = await prisma.boss.findMany({ where: { deletedAt: null } });
  bosses.forEach((b) => {
    extractLinks(b.descriptionDe, `Boss: ${b.nameDe}`);
    extractLinks(b.strategyDe, `Boss: ${b.nameDe}`);
  });

  // 4. Fetch all Wiki Pages
  const pages = await prisma.wikiPage.findMany({ where: { deletedAt: null } });
  pages.forEach((p) => {
    extractLinks(p.bodyDe, `WikiPage: ${p.titleDe}`);
  });

  // Determine validity
  for (const res of results) {
    if (!res.link.startsWith("/")) {
      res.valid = true; // external or weird
      continue;
    }

    const parts = res.link.split("/");
    if (parts.length >= 3) {
      const kind = parts[1]; // e.g. "items"
      const slug = parts[2]; // e.g. "diamond_sword"

      // Find if this slug exists in the respective table
      try {
        // A very naive check by calling the DB directly
        let table = KIND_TABLE[kind as keyof typeof KIND_TABLE];
        if (!table) table = "wikiPage" as any;
        const modelName = prismaModels[table as keyof typeof prismaModels] as keyof typeof prisma;
        if (modelName) {
          const model = prisma[modelName] as any;
          const exists = await model.findFirst({ where: { slug, deletedAt: null } });
          if (exists) {
            res.valid = true;
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return results;
});
export const getRecentlyViewed = createServerFn({ method: "GET" })
  .validator((d: { userId: string }) => d)
  .handler(async ({ data }) => {
    const profile = await prisma.profile.findUnique({ where: { id: data.userId } });
    return (profile?.recentlyViewed as any[]) || [];
  });

export const saveRecentlyViewed = createServerFn({ method: "POST" })
  .validator((d: { userId: string; history: any }) => d)
  .handler(async ({ data }) => {
    return prisma.profile.upsert({
      where: { id: data.userId },
      update: { recentlyViewed: data.history },
      create: { id: data.userId, recentlyViewed: data.history },
    });
  });
