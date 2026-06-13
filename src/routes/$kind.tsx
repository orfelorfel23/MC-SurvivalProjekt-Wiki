import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang, pickLocalized, t, KIND_TABLE, KIND_LABEL_KEY, type Kind } from "@/lib/i18n";

export const Route = createFileRoute("/$kind")({
  beforeLoad: ({ params }) => {
    if (!(params.kind in KIND_TABLE)) throw notFound();
  },
  component: KindList,
  notFoundComponent: () => <div className="container mx-auto px-4 py-8">Unbekannte Kategorie.</div>,
});

function KindList() {
  const { kind } = Route.useParams();
  const k = kind as Kind;
  const { lang } = useLang();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const titleField = k === "wiki" ? "title_de,title_en" : "name_de,name_en";
    supabase
      .from(KIND_TABLE[k])
      .select(`id,slug,${titleField},image_url,category,tags,description_de,description_en${k === "wiki" ? ",body_de,body_en" : ""}`.replace(",image_url", k === "commands" || k === "tasks" || k === "recipes" || k === "wiki" ? "" : ",image_url"))
      .order("updated_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [k]);

  const label = t(KIND_LABEL_KEY[k], lang);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl mb-6 text-primary">{label}</h1>
      {loading && <p className="text-muted-foreground">{t("loading", lang)}</p>}
      {!loading && rows.length === 0 && <p className="text-muted-foreground">{t("noResults", lang)}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r) => {
          const title = k === "wiki"
            ? pickLocalized(r.title_de, r.title_en, lang)
            : pickLocalized(r.name_de, r.name_en, lang);
          const snippet = k === "wiki"
            ? pickLocalized(r.body_de, r.body_en, lang)?.slice(0, 120)
            : pickLocalized(r.description_de, r.description_en, lang)?.slice(0, 120);
          return (
            <Link key={r.id} to="/$kind/$slug" params={{ kind: k, slug: r.slug }}
              className="mc-panel p-4 hover:bg-accent/10 transition-colors flex gap-3">
              {r.image_url && (
                <div className="mc-slot w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img src={r.image_url} alt="" className="w-12 h-12 object-contain" style={{ imageRendering: "pixelated" }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm mb-1">{title}</div>
                <div className="text-xs text-muted-foreground line-clamp-3">{snippet}</div>
                {r.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {r.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}