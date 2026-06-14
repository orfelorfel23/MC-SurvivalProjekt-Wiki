import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useLang, pickLocalized, t, KIND_TABLE, KIND_LABEL_KEY, type Kind } from "@/lib/i18n";
import { CraftingGrid, type GridItem, type GridSlot } from "@/components/crafting-grid";

export const Route = createFileRoute("/$kind/$slug")({
  beforeLoad: ({ params }) => {
    if (!(params.kind in KIND_TABLE)) throw notFound();
  },
  component: DetailPage,
  notFoundComponent: () => <div className="container mx-auto px-4 py-8">Nicht gefunden.</div>,
});

function DetailPage() {
  const { kind, slug } = Route.useParams();
  const k = kind as Kind;
  const { lang } = useLang();
  const [row, setRow] = useState<any>(null);
  const [extras, setExtras] = useState<{ items?: Record<string, GridItem>; result?: GridItem | null; recipes?: any[]; world?: any; spawnItem?: GridItem | null }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (supabase.from(KIND_TABLE[k] as any) as any).select("*").eq("slug", slug).maybeSingle().then(async ({ data }: { data: any }) => {
      setRow(data);
      if (data && k === "rezepte") {
        const grid: GridSlot[] = Array.isArray(data.grid) ? data.grid : [];
        const ids = new Set<string>();
        grid.forEach((s) => s?.item_id && ids.add(s.item_id));
        if (data.result_item_id) ids.add(data.result_item_id);
        const items: Record<string, GridItem> = {};
        let result: GridItem | null = null;
        if (ids.size > 0) {
          const { data: its } = await supabase.from("items").select("id,slug,name_de,name_en,image_url,enchanted").in("id", Array.from(ids));
          (its ?? []).forEach((it: any) => { items[it.id] = it; });
          if (data.result_item_id) result = items[data.result_item_id] ?? null;
        }
        setExtras({ items, result });
      } else if (data && k === "items") {
        const { data: recipes } = await supabase.from("recipes").select("id,slug,name_de,name_en,grid,result_item_id,result_count,shaped,station").or(`result_item_id.eq.${data.id},grid.cs.[{"item_id":"${data.id}"}]`);
        setExtras({ recipes: recipes ?? [] });
      } else if (data && k === "bosse") {
        const refs: any = {};
        if (data.world_id) {
          const { data: w } = await supabase.from("worlds").select("slug,name_de,name_en").eq("id", data.world_id).maybeSingle();
          refs.world = w;
        }
        if (data.spawn_item_id) {
          const { data: si } = await supabase.from("items").select("id,slug,name_de,name_en,image_url,enchanted").eq("id", data.spawn_item_id).maybeSingle();
          refs.spawnItem = si;
        }
        setExtras(refs);
      }
      setLoading(false);
    });
  }, [k, slug]);

  if (loading) return <div className="container mx-auto px-4 py-8 text-muted-foreground">Lädt...</div>;
  if (!row) return <div className="container mx-auto px-4 py-8">Nicht gefunden.</div>;

  const title = k === "wiki"
    ? pickLocalized(row.title_de, row.title_en, lang)
    : pickLocalized(row.name_de, row.name_en, lang);
  const description = pickLocalized(row.description_de, row.description_en, lang);

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/$kind" params={{ kind: k }} className="text-xs text-muted-foreground hover:text-foreground">
        ← {t(KIND_LABEL_KEY[k], lang)}
      </Link>
      <header className="my-4 flex flex-wrap items-start gap-4">
        {row.image_url && (
          <div className={`mc-slot w-24 h-24 flex items-center justify-center ${row.enchanted ? "mc-glint" : ""}`}>
            <img src={row.image_url} alt={title} className="w-20 h-20 object-contain" style={{ imageRendering: "pixelated" }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl text-primary mb-2">{title}</h1>
          <div className="flex gap-2 flex-wrap text-xs">
            {row.rarity && <span className="px-2 py-0.5 rounded border border-border">{row.rarity}</span>}
            {row.category && <span className="px-2 py-0.5 rounded bg-muted">{row.category}</span>}
            {row.difficulty && <span className="px-2 py-0.5 rounded border border-border">{row.difficulty}</span>}
            {row.frequency && <span className="px-2 py-0.5 rounded border border-border">{row.frequency}</span>}
            {row.world_type && <span className="px-2 py-0.5 rounded border border-border">{row.world_type}</span>}
            {row.kind && <span className="px-2 py-0.5 rounded border border-border">{row.kind}</span>}
            {row.oraxen_id && <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-mono">{row.oraxen_id}</span>}
            {row.tags?.map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-muted">#{tag}</span>
            ))}
          </div>
        </div>
      </header>

      {k === "befehle" && (
        <div className="mc-panel p-4 mb-6">
          <div className="text-xs text-accent uppercase mb-1">{t("syntax", lang)}</div>
          <code className="text-sm font-mono">{row.syntax}</code>
          {row.permission && <div className="mt-2 text-xs text-muted-foreground">{t("permission", lang)}: <code>{row.permission}</code></div>}
        </div>
      )}

      {k === "shop" && (
        <div className="mb-4 text-lg"><span className="text-accent font-bold">{row.price}</span> {row.currency}</div>
      )}

      {k === "aufgaben" && row.reward_amount && (
        <div className="mb-4 text-lg">{t("reward", lang)}: <span className="text-accent font-bold">{row.reward_amount} {row.reward_currency}</span></div>
      )}

      {description && (
        <section className="prose prose-invert max-w-none mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
        </section>
      )}

      {k === "wiki" && row.body_de && (
        <section className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{pickLocalized(row.body_de, row.body_en, lang)}</ReactMarkdown>
        </section>
      )}

      {k === "befehle" && row.examples && (
        <section className="mc-panel p-4 mt-4">
          <div className="text-xs text-accent uppercase mb-2">{t("examples", lang)}</div>
          <pre className="text-sm font-mono whitespace-pre-wrap">{row.examples}</pre>
        </section>
      )}

      {k === "bosse" && (
        <div className="space-y-3 mb-6">
          {extras.world && <div>{t("world", lang)}: <Link to="/$kind/$slug" params={{ kind: "welten", slug: extras.world.slug }} className="text-accent">{pickLocalized(extras.world.name_de, extras.world.name_en, lang)}</Link></div>}
          {extras.spawnItem && <div>{t("spawnItem", lang)}: <Link to="/$kind/$slug" params={{ kind: "items", slug: extras.spawnItem.slug }} className="text-accent">{pickLocalized(extras.spawnItem.name_de, extras.spawnItem.name_en, lang)}</Link></div>}
          {row.strategy_de && (
            <div>
              <h3 className="text-sm uppercase tracking-widest text-accent mb-2">{t("strategy", lang)}</h3>
              <div className="prose prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{pickLocalized(row.strategy_de, row.strategy_en, lang)}</ReactMarkdown></div>
            </div>
          )}
        </div>
      )}

      {k === "rezepte" && extras.items && (
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-3">
            {row.shaped ? t("recipeShaped", lang) : t("recipeShapeless", lang)} · {t("station", lang)}: {row.station}
          </div>
          <CraftingGrid grid={row.grid} items={extras.items} result={extras.result} resultCount={row.result_count} shaped={row.shaped} />
        </div>
      )}

      {k === "items" && extras.recipes && extras.recipes.length > 0 && (
        <section className="mt-8">
          <h3 className="text-sm uppercase tracking-widest text-accent mb-3">{t("craftedBy", lang)}</h3>
          <div className="grid gap-2">
            {extras.recipes.map((r: any) => (
              <Link key={r.id} to="/$kind/$slug" params={{ kind: "rezepte", slug: r.slug }} className="mc-panel p-3 hover:bg-accent/10 text-sm">
                {pickLocalized(r.name_de, r.name_en, lang)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}