import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getKindItem } from "@/server/functions";
import { useAuth } from "@/lib/use-auth";
import { saveGenericEntity } from "@/server/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  const { isEditor } = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [extras, setExtras] = useState<{
    items?: Record<string, GridItem>;
    result?: GridItem | null;
    recipes?: any[];
    world?: any;
    spawnItem?: GridItem | null;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getKindItem({ data: { kindId: k, slug } })
      .then((data: any) => {
        setRow(data);
        setEditData(data || {});
        if (data && k === "rezepte") {
          const grid: GridSlot[] = Array.isArray(data.grid) ? data.grid : [];
          const ids = new Set<string>();
          grid.forEach((s) => s?.item_id && ids.add(s.item_id));
          if (data.result_item_id) ids.add(data.result_item_id);
          const items: Record<string, GridItem> = {};
          let result: GridItem | null = null;
          if (ids.size > 0 && data._resolvedItems) {
            data._resolvedItems.forEach((it: any) => {
              items[it.id] = it;
            });
            if (data.result_item_id) result = items[data.result_item_id] ?? null;
          }
          setExtras({ items, result });
        } else if (data && k === "items") {
          setExtras({ recipes: data.recipes ?? [] });
        } else if (data && k === "bosse") {
          setExtras({ world: data.world, spawnItem: data.spawnItem });
        }
        setLoading(false);
      })
      .catch(console.error);
  }, [k, slug]);

  if (loading)
    return <div className="container mx-auto px-4 py-8 text-muted-foreground">Lädt...</div>;
  if (!row) return <div className="container mx-auto px-4 py-8">Nicht gefunden.</div>;

  const handleEditClick = () => {
    if (k === "rezepte") {
      navigate({ to: "/editor/recipes/$id", params: { id: slug } });
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...editData };
      delete payload.author;
      delete payload.recipes;
      delete payload._resolvedItems;
      delete payload.world;
      delete payload.spawnItem;
      // remove undefined/null just in case
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

      await saveGenericEntity({ data: { kindId: k, slug, data: payload } });
      setRow(payload);
      setIsEditing(false);
      toast.success("Gespeichert!");
    } catch(e) {
      toast.error("Fehler beim Speichern");
    }
    setSaving(false);
  };

  if (isEditing) {
    const fields = [
      { key: "nameDe", label: "Name (DE)" },
      { key: "titleDe", label: "Titel (DE)" },
      { key: "descriptionDe", label: "Beschreibung (DE)", textarea: true },
      { key: "bodyDe", label: "Inhalt (DE)", textarea: true },
      { key: "imageUrl", label: "Bild URL" },
      { key: "category", label: "Kategorie" },
      { key: "price", label: "Preis (Shop)", type: "number" },
      { key: "currency", label: "Währung" },
      { key: "rewardAmount", label: "Belohnung", type: "number" },
      { key: "rewardCurrency", label: "Belohnung Währung" },
      { key: "syntax", label: "Syntax" },
      { key: "permission", label: "Permission" },
      { key: "examples", label: "Beispiele", textarea: true },
      { key: "strategyDe", label: "Strategie (DE)", textarea: true }
    ];

    return (
      <article className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-primary">Bearbeiten: {slug}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Speichert..." : "Speichern"}</Button>
          </div>
        </div>
        <div className="grid gap-4 bg-card p-6 border border-border">
          {fields.filter(f => editData[f.key] !== undefined).map(f => (
            <div key={f.key} className="grid gap-2">
              <Label>{f.label}</Label>
              {f.textarea ? (
                <Textarea value={editData[f.key]} onChange={e => setEditData({...editData, [f.key]: e.target.value})} rows={5} />
              ) : (
                <Input type={f.type || "text"} value={editData[f.key]} onChange={e => setEditData({...editData, [f.key]: f.type === "number" ? parseInt(e.target.value) || 0 : e.target.value})} />
              )}
            </div>
          ))}
        </div>
      </article>
    );
  }

  const title =
    k === "wiki"
      ? pickLocalized(row.titleDe, row.titleEn, lang)
      : pickLocalized(row.nameDe, row.nameEn, lang);
  const description = pickLocalized(row.descriptionDe, row.descriptionEn, lang);

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl relative">
      <div className="flex justify-between items-start">
        <Link
          to="/$kind"
          params={{ kind: k }}
          className="text-xs text-muted-foreground hover:text-foreground inline-block mb-4"
        >
          ← {t(KIND_LABEL_KEY[k], lang)}
        </Link>
        {isEditor && (
          <Button variant="outline" size="sm" onClick={handleEditClick}>Bearbeiten</Button>
        )}
      </div>
      <header className="my-2 flex flex-wrap items-start gap-4">
        {row.imageUrl && (
          <div
            className={`mc-slot w-24 h-24 flex items-center justify-center ${row.enchanted ? "mc-glint" : ""}`}
          >
            <img
              src={row.imageUrl}
              alt={title}
              className="w-20 h-20 object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl text-primary mb-2">{title}</h1>
          <div className="flex gap-2 flex-wrap text-xs">
            {row.rarity && (
              <span className="px-2 py-0.5 rounded border border-border">{row.rarity}</span>
            )}
            {row.category && <span className="px-2 py-0.5 rounded bg-muted">{row.category}</span>}
            {row.difficulty && (
              <span className="px-2 py-0.5 rounded border border-border">{row.difficulty}</span>
            )}
            {row.frequency && (
              <span className="px-2 py-0.5 rounded border border-border">{row.frequency}</span>
            )}
            {row.worldType && (
              <span className="px-2 py-0.5 rounded border border-border">{row.worldType}</span>
            )}
            {row.kind && (
              <span className="px-2 py-0.5 rounded border border-border">{row.kind}</span>
            )}
            {row.oraxenId && (
              <span className="px-2 py-0.5 rounded bg-accent/20 text-accent font-mono">
                {row.oraxenId}
              </span>
            )}
            {row.tags?.map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-muted">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {k === "befehle" && (
        <div className="mc-panel p-4 mb-6">
          <div className="text-xs text-accent uppercase mb-1">{t("syntax", lang)}</div>
          <code className="text-sm font-mono">{row.syntax}</code>
          {row.permission && (
            <div className="mt-2 text-xs text-muted-foreground">
              {t("permission", lang)}: <code>{row.permission}</code>
            </div>
          )}
        </div>
      )}

      {k === "shop" && (
        <div className="mb-4 text-lg">
          <span className="text-accent font-bold">{row.price}</span> {row.currency}
        </div>
      )}

      {k === "aufgaben" && row.rewardAmount && (
        <div className="mb-4 text-lg">
          {t("reward", lang)}:{" "}
          <span className="text-accent font-bold">
            {row.rewardAmount} {row.rewardCurrency}
          </span>
        </div>
      )}

      {description && (
        <section className="prose prose-invert max-w-none mb-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{description}</ReactMarkdown>
        </section>
      )}

      {k === "wiki" && row.bodyDe && (
        <section className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {pickLocalized(row.bodyDe, row.bodyEn, lang)}
          </ReactMarkdown>
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
          {extras.world && (
            <div>
              {t("world", lang)}:{" "}
              <Link
                to="/$kind/$slug"
                params={{ kind: "welten", slug: extras.world.slug }}
                className="text-accent"
              >
                {pickLocalized(extras.world.nameDe, extras.world.nameEn, lang)}
              </Link>
            </div>
          )}
          {extras.spawnItem && (
            <div>
              {t("spawnItem", lang)}:{" "}
              <Link
                to="/$kind/$slug"
                params={{ kind: "items", slug: extras.spawnItem.slug }}
                className="text-accent"
              >
                {pickLocalized(extras.spawnItem.nameDe, extras.spawnItem.nameEn, lang)}
              </Link>
            </div>
          )}
          {row.strategyDe && (
            <div>
              <h3 className="text-sm uppercase tracking-widest text-accent mb-2">
                {t("strategy", lang)}
              </h3>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pickLocalized(row.strategyDe, row.strategyEn, lang)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {k === "rezepte" && extras.items && (
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-3">
            {row.shaped ? t("recipeShaped", lang) : t("recipeShapeless", lang)} ·{" "}
            {t("station", lang)}: {row.station}
          </div>
          <CraftingGrid
            grid={row.grid}
            items={extras.items}
            result={extras.result}
            resultCount={row.resultCount}
            shaped={row.shaped}
          />
        </div>
      )}

      {k === "items" && extras.recipes && extras.recipes.length > 0 && (
        <section className="mt-8">
          <h3 className="text-sm uppercase tracking-widest text-accent mb-3">
            {t("craftedBy", lang)}
          </h3>
          <div className="grid gap-2">
            {extras.recipes.map((r: any) => (
              <Link
                key={r.id}
                to="/$kind/$slug"
                params={{ kind: "rezepte", slug: r.slug }}
                className="mc-panel p-3 hover:bg-accent/10 text-sm"
              >
                {pickLocalized(r.nameDe, r.nameEn, lang)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
