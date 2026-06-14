import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getKindList, getWikiTabs, getTabModulesData } from "@/server/functions";
import { useLang, pickLocalized, t, KIND_TABLE, KIND_LABEL_KEY } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/$kind/")({
  component: KindList,
  notFoundComponent: () => <div className="container mx-auto px-4 py-8">Unbekannte Kategorie.</div>,
});

function KindList() {
  const { kind } = Route.useParams();
  const k = kind as string;
  const { lang } = useLang();
  const [rows, setRows] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: tabs } = useQuery({
    queryKey: ["wikiTabs"],
    queryFn: () => getWikiTabs(),
  });
  const currentTab = tabs?.find((t: any) => t.slug === k);

  useEffect(() => {
    if (!currentTab) return;
    setLoading(true);
    if (currentTab.isBuiltin) {
      getKindList({ data: { kindId: k } })
        .then((data: any) => {
          setRows(data ?? []);
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    } else {
      getTabModulesData({ data: { tabSlug: k } })
        .then((data: any) => {
          setModules(data ?? []);
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    }
  }, [k, currentTab]);

  const label = currentTab 
    ? (lang === "de" ? currentTab.nameDe : (currentTab.nameEn || currentTab.nameDe)) 
    : (k in KIND_LABEL_KEY ? t(KIND_LABEL_KEY[k as keyof typeof KIND_LABEL_KEY], lang) : k);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl mb-6 text-primary">{label}</h1>
      {loading && <p className="text-muted-foreground">{t("loading", lang)}</p>}
      {!loading && currentTab?.isBuiltin && rows.length === 0 && (
        <p className="text-muted-foreground">{t("noResults", lang)}</p>
      )}
      {!loading && !currentTab?.isBuiltin && modules.length === 0 && (
        <p className="text-muted-foreground">Diese Seite hat noch keine Module.</p>
      )}
      
      {currentTab?.isBuiltin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r) => {
          const title =
            (k === "wiki" || !currentTab?.isBuiltin)
              ? pickLocalized(r.titleDe, r.titleEn, lang)
              : pickLocalized(r.nameDe, r.nameEn, lang);
          const snippet =
            (k === "wiki" || !currentTab?.isBuiltin)
              ? pickLocalized(r.bodyDe, r.bodyEn, lang)?.slice(0, 120)
              : pickLocalized(r.descriptionDe, r.descriptionEn, lang)?.slice(0, 120);
          return (
            <Link
              key={r.id}
              to="/$kind/$slug"
              params={{ kind: k, slug: r.slug }}
              className="mc-panel p-4 hover:bg-accent/10 transition-colors flex gap-3"
            >
              {r.imageUrl && (
                <div className="mc-slot w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={r.imageUrl}
                    alt=""
                    className="w-12 h-12 object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm mb-1">{title}</div>
                <div className="text-xs text-muted-foreground line-clamp-3">{snippet}</div>
                {r.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {r.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      )}

      {!currentTab?.isBuiltin && (
        <div className="flex flex-col gap-6">
          {modules.map((mod, i) => {
            if (mod.type === "text") {
              return (
                <div key={i} className="prose prose-invert max-w-none">
                  {lang === "de" ? mod.contentDe : (mod.contentEn || mod.contentDe)}
                </div>
              );
            }
            if (mod.data) {
              const r = mod.data;
              const title = pickLocalized(r.nameDe || r.titleDe, r.nameEn || r.titleEn, lang);
              const snippet = pickLocalized(r.descriptionDe || r.bodyDe, r.descriptionEn || r.bodyEn, lang)?.slice(0, 120);
              return (
                <Link
                  key={i}
                  to="/$kind/$slug"
                  params={{ kind: mod.type + "e", slug: r.slug }} // rudimentary plural
                  className="mc-panel p-4 hover:bg-accent/10 transition-colors flex gap-3 max-w-md"
                >
                  {r.imageUrl && (
                    <div className="mc-slot w-16 h-16 flex-shrink-0 flex items-center justify-center">
                      <img src={r.imageUrl} alt="" className="w-12 h-12 object-contain" style={{ imageRendering: "pixelated" }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm mb-1">{title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-3">{snippet}</div>
                  </div>
                </Link>
              );
            }
            return <div key={i}>Unbekanntes Modul ({mod.type})</div>;
          })}
        </div>
      )}
    </div>
  );
}

