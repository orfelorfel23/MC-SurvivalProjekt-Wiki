import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useLang, t } from "@/lib/i18n";
import { getKindList } from "@/server/functions";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

// Basic Recipe Editor
export const Route = createFileRoute("/editor/recipes/")({
  component: RecipeEditorList,
});

function RecipeEditorList() {
  const { isEditor } = useAuth();
  const { lang } = useLang();

  const { data: recipes } = useQuery({
    queryKey: ["kindList", "rezepte"],
    queryFn: () => getKindList({ data: { kindId: "rezepte" } }),
    enabled: !!isEditor,
    staleTime: 5 * 60 * 1000,
  });

  if (!isEditor) return <div className="p-8">Access denied</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-primary">Rezepte verwalten</h1>
        <Link to="/editor/recipes/$id" params={{ id: "new" }}>
          <Button>{t("new", lang)} Rezept</Button>
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {recipes?.map((r: any) => (
          <div key={r.id} className="mc-panel p-4 flex justify-between items-center">
            <div>
              <div className="font-bold">{r.nameDe}</div>
              <div className="text-xs text-muted-foreground">{r.slug}</div>
            </div>
            <Link to="/editor/recipes/$id" params={{ id: r.slug }}>
              <Button variant="outline" size="sm">
                {t("edit", lang)}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
