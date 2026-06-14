import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getWikiTabs } from "@/server/functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/editor/tabs")({
  component: TabsList,
});

function TabsList() {
  const { data: tabs, isLoading } = useQuery({
    queryKey: ["wikiTabs"],
    queryFn: () => getWikiTabs(),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-primary">Tabs verwalten</h1>
        <Link to="/editor/tabs/$id" params={{ id: "new" }}>
          <Button>Neuer Tab (Topic)</Button>
        </Link>
      </div>

      {isLoading && <p>Lädt...</p>}
      
      <div className="flex flex-col gap-2">
        {tabs?.map((t) => (
          <div key={t.id} className="mc-panel p-4 flex justify-between items-center">
            <div>
              <div className="font-bold flex items-center gap-2">
                {t.nameDe} 
                {!t.isVisible && <span className="text-xs text-red-400 border border-red-400 px-1 rounded">Versteckt</span>}
                {t.isBuiltin && <span className="text-[10px] bg-accent/20 text-accent px-1 rounded">Built-in</span>}
              </div>
              <div className="text-xs text-muted-foreground">/{t.slug}</div>
            </div>
            <Link to="/editor/tabs/$id" params={{ id: t.slug }}>
              <Button variant="outline" size="sm">Bearbeiten</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
