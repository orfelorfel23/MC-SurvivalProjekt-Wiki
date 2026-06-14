import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { getKindList } from "@/server/functions";
import { Button } from "@/components/ui/button";

// Basic Recipe Editor
export const Route = createFileRoute("/editor/recipes/")({
  component: RecipeEditorList,
});

function RecipeEditorList() {
  const { isEditor } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    if (!isEditor) return;
    getKindList({ data: { kindId: "rezepte" } }).then(setRecipes);
  }, [isEditor]);

  if (!isEditor) return <div className="p-8">Access denied</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-primary">Rezepte verwalten</h1>
        <Link to="/editor/recipes/new">
          <Button>Neues Rezept</Button>
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {recipes.map((r) => (
          <div key={r.id} className="mc-panel p-4 flex justify-between items-center">
            <div>
              <div className="font-bold">{r.nameDe}</div>
              <div className="text-xs text-muted-foreground">{r.slug}</div>
            </div>
            <Link to="/editor/recipes/$id" params={{ id: r.slug }}>
              <Button variant="outline" size="sm">Bearbeiten</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
