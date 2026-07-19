import { createFileRoute } from "@tanstack/react-router";
import { useLang, t } from "@/lib/i18n";
import { getWikiPois } from "@/server/functions";
import { useQuery } from "@tanstack/react-query";
import ClientWikiMap from "@/components/wiki-map";

export const Route = createFileRoute("/karte")({
  component: MapPage,
});

export function MapPage() {
  const { lang } = useLang();

  const { data: pois = [], isLoading } = useQuery({
    queryKey: ["wikiPois"],
    queryFn: () => getWikiPois(),
  });

  return (
    <div className="container mx-auto px-4 py-8 h-[80vh] flex flex-col">
      <h1 className="text-2xl text-primary mb-4">{t("map", lang)}</h1>
      <div className="flex-1 bg-black/50 border border-border rounded-lg overflow-hidden relative mc-panel p-1">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            Lade POIs...
          </div>
        ) : (
          <ClientWikiMap pois={pois as any[]} />
        )}
      </div>
    </div>
  );
}
