import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { useLang, t } from "@/lib/i18n";
import {
  saveRecipe,
  getKindItem,
  getKindList,
  softDeleteGenericEntity,
} from "@/server/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { ItemPicker } from "@/components/item-picker";
import type { GridSlot } from "@/components/crafting-grid";
import { toast } from "sonner";
import { DiffModal } from "@/components/diff-modal";

export const Route = createFileRoute("/editor/recipes/$id")({
  component: RecipeEditorDetail,
});

function RecipeEditorDetail() {
  const { id } = Route.useParams();
  const { isEditor } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();

  const [deleting, setDeleting] = useState(false);

  const [recipe, setRecipe] = useState({
    id: undefined as string | undefined,
    nameDe: "",
    slug: "",
    shaped: true,
    station: "workbench",
    resultCount: 1,
    grid: Array(9).fill(null) as GridSlot[],
    resultItem: null as GridSlot | null,
  });
  const [originalRecipe, setOriginalRecipe] = useState<any>(null);
  const [showDiff, setShowDiff] = useState(false);

  const { data: fetchedRecipe } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => getKindItem({ data: { kindId: "rezepte", slug: id } }),
    enabled: id !== "new",
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (id !== "new" && fetchedRecipe) {
      const r = fetchedRecipe as any;
      // Map the resultItemId to a format ItemPicker understands
      let resultItem = null;
      if (r.resultItemId) {
        // Find it in resolved items if possible, or just create a db reference
        const resolved = r._resolvedItems?.find((i: any) => i.id === r.resultItemId);
        if (resolved && resolved.oraxenId) {
          resultItem = {
            type: "vanilla",
            mc_id: resolved.oraxenId,
            name: resolved.nameDe,
            enchanted: resolved.enchanted,
          };
        } else {
          resultItem = { type: "db", item_id: r.resultItemId };
        }
      }

      const mapped = {
        id: r.id,
        nameDe: r.nameDe || "",
        slug: r.slug || "",
        shaped: r.shaped,
        station: r.station || "workbench",
        resultCount: r.resultCount || 1,
        grid: Array.isArray(r.grid) && r.grid.length === 9 ? r.grid : Array(9).fill(null),
        resultItem: resultItem as any,
      };
      setRecipe(mapped as any);
      setOriginalRecipe(mapped as any);
    }
  }, [id, fetchedRecipe]);

  const handleDeleteClick = async () => {
    if (!confirm("Wirklich komplett löschen?")) return;
    setDeleting(true);
    try {
      await softDeleteGenericEntity({ data: { kindId: "rezepte", slug: recipe.slug } });
      toast.success("Gelöscht!");
      navigate({ to: "/$kind", params: { kind: "rezepte" }, replace: true });
    } catch (e) {
      toast.error("Fehler beim Löschen");
      setDeleting(false);
    }
  };

  const handleSaveInit = () => {
    setShowDiff(true);
  };

  const confirmSave = async () => {
    try {
      await saveRecipe({ data: { ...recipe, id: recipe.id } });
      toast.success("Rezept gespeichert!");
      navigate({ to: "/editor/recipes" });
    } catch (e: any) {
      if (e?.message?.includes("DUPLICATE_RECIPE")) {
        toast.error("Ein Rezept mit genau diesem Crafting Grid existiert bereits!");
      } else {
        toast.error("Fehler beim Speichern.");
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl text-primary">
          {id === "new" ? t("new", lang) + " Rezept" : "Rezept " + t("edit", lang).toLowerCase()}
        </h1>
        <div className="flex gap-2">
          {id !== "new" && (
            <Button variant="destructive" onClick={handleDeleteClick} disabled={deleting}>
              {deleting ? t("loading", lang) : t("delete", lang)}
            </Button>
          )}
          <Button onClick={handleSaveInit}>{t("save", lang)}</Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input
            value={recipe.nameDe}
            onChange={(e) => setRecipe({ ...recipe, nameDe: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Slug (URL)</Label>
          <Input
            value={recipe.slug}
            onChange={(e) => setRecipe({ ...recipe, slug: e.target.value })}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={recipe.shaped}
              onCheckedChange={(v) => setRecipe({ ...recipe, shaped: v })}
            />
            <Label>Geformt (Shaped)</Label>
          </div>
        </div>

        <div className="flex gap-8 flex-wrap">
          <div className="mc-panel p-6 self-start flex flex-col gap-4">
            <h3 className="text-sm font-bold text-accent">Crafting Grid</h3>
            <div className="grid grid-cols-3 gap-2 w-max">
              {recipe.grid.map((slot, i) => (
                <ItemPicker
                  key={i}
                  slot={slot}
                  onChange={(s) => {
                    const newGrid = [...recipe.grid];
                    newGrid[i] = s;
                    setRecipe({ ...recipe, grid: newGrid });
                  }}
                  onClear={() => {
                    const newGrid = [...recipe.grid];
                    newGrid[i] = null;
                    setRecipe({ ...recipe, grid: newGrid });
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mc-panel p-6 self-start flex flex-col gap-4">
            <h3 className="text-sm font-bold text-accent">Ergebnis (Result)</h3>
            <div className="flex items-center gap-4">
              <span className="text-2xl text-muted-foreground">→</span>
              <ItemPicker
                slot={recipe.resultItem}
                onChange={(s) => setRecipe({ ...recipe, resultItem: s })}
                onClear={() => setRecipe({ ...recipe, resultItem: null })}
              />
              <Input
                type="number"
                value={recipe.resultCount}
                onChange={(e) =>
                  setRecipe({ ...recipe, resultCount: parseInt(e.target.value) || 1 })
                }
                className="w-20"
                min={1}
                max={64}
              />
            </div>
          </div>
        </div>
      </div>

      <DiffModal
        isOpen={showDiff}
        onClose={() => setShowDiff(false)}
        onConfirm={confirmSave}
        oldData={originalRecipe || {}}
        newData={recipe}
      />
    </div>
  );
}
