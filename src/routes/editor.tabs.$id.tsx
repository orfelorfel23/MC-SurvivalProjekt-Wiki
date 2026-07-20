import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { useLang, t } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWikiTabs, saveTab, getKindList, softDeleteTab } from "@/server/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import rehypeSanitize from "rehype-sanitize";
import { DiffModal } from "@/components/diff-modal";

// Map module type -> kind slug used by getKindList
const MODULE_KIND: Record<string, string> = {
  recipe: "rezepte",
  boss: "bosse",
  item: "items",
  command: "befehle",
};

function EntityPicker({
  type,
  value,
  onChange,
}: {
  type: string;
  value: string;
  onChange: (id: string, label: string) => void;
}) {
  const kindSlug = MODULE_KIND[type];
  const [search, setSearch] = useState("");
  const [label, setLabel] = useState(value ? `ID: ${value.slice(0, 8)}...` : "");

  const { data: entities } = useQuery({
    queryKey: ["kindList", kindSlug],
    queryFn: () => getKindList({ data: { kindId: kindSlug } }),
    enabled: !!kindSlug,
    staleTime: 60_000,
  });

  const filtered = (entities as any[] | undefined)
    ?.filter((e: any) => (e.nameDe || e.titleDe || "").toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="grid gap-1">
      <Label className="text-xs">{type} – Suche nach Name</Label>
      <Input
        placeholder={`${type} suchen...`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {label && <p className="text-xs text-accent">Ausgewählt: {label}</p>}
      {search.length > 0 && filtered && filtered.length > 0 && (
        <div className="border border-border rounded bg-popover">
          {filtered.map((e: any) => (
            <button
              key={e.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/20 transition-colors"
              onClick={() => {
                onChange(e.id, e.nameDe || e.titleDe);
                setLabel(e.nameDe || e.titleDe);
                setSearch("");
              }}
            >
              <span className="font-medium">{e.nameDe || e.titleDe}</span>
              <span className="text-xs text-muted-foreground ml-2">{e.slug}</span>
            </button>
          ))}
        </div>
      )}
      {search.length > 0 && (!filtered || filtered.length === 0) && (
        <p className="text-xs text-muted-foreground px-1">Keine Treffer.</p>
      )}
    </div>
  );
}

export const Route = createFileRoute("/editor/tabs/$id")({
  component: TabEditorDetail,
});

function TabEditorDetail() {
  const { id } = Route.useParams();
  const { isEditor } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: tabs } = useQuery({
    queryKey: ["wikiTabs"],
    queryFn: () => getWikiTabs(),
    staleTime: 5 * 60 * 1000,
  });

  const [tab, setTab] = useState({
    id: id === "new" ? "new" : "",
    slug: "",
    nameDe: "",
    nameEn: "",
    isBuiltin: false,
    isVisible: true,
    order: 0,
    modules: [] as any[],
  });
  const [originalTab, setOriginalTab] = useState<any>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id !== "new" && tabs) {
      const existing = tabs.find((t) => t.slug === id);
      if (existing) {
        const mapped = {
          id: existing.id,
          slug: existing.slug,
          nameDe: existing.nameDe,
          nameEn: existing.nameEn || "",
          isBuiltin: existing.isBuiltin,
          isVisible: existing.isVisible,
          order: existing.order,
          modules: Array.isArray(existing.modules) ? existing.modules : [],
        };
        setTab(mapped);
        setOriginalTab(mapped);
      }
    }
  }, [id, tabs]);

  const handleDeleteClick = async () => {
    if (!confirm("Wirklich komplett löschen?")) return;
    setDeleting(true);
    try {
      await softDeleteTab({ data: { slug: tab.slug } });
      toast.success("Tab gelöscht!");
      qc.invalidateQueries({ queryKey: ["wikiTabs"] });
      navigate({ to: "/editor/tabs", replace: true });
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
      await saveTab({ data: tab });
      toast.success("Tab gespeichert!");
      qc.invalidateQueries({ queryKey: ["wikiTabs"] });
      navigate({ to: "/editor/tabs" });
    } catch (e) {
      toast.error("Fehler beim Speichern.");
    }
  };

  const addModule = (type: string) => {
    setTab((prev) => ({ ...prev, modules: [...prev.modules, { type, id: "", contentDe: "" }] }));
  };

  const updateModule = (index: number, changes: any) => {
    const newMods = [...tab.modules];
    newMods[index] = { ...newMods[index], ...changes };
    setTab((prev) => ({ ...prev, modules: newMods }));
  };

  const removeModule = (index: number) => {
    const newMods = [...tab.modules];
    newMods.splice(index, 1);
    setTab((prev) => ({ ...prev, modules: newMods }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl text-primary">
          {id === "new" ? t("new", lang) + " Tab" : "Tab " + t("edit", lang).toLowerCase()}
        </h1>
        <div className="flex gap-2">
          {id !== "new" && !tab.isBuiltin && (
            <Button variant="destructive" onClick={handleDeleteClick} disabled={deleting}>
              {deleting ? t("loading", lang) : t("delete", lang)}
            </Button>
          )}
          <Button onClick={handleSaveInit}>{t("save", lang)}</Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label>Name (DE)</Label>
          <Input value={tab.nameDe} onChange={(e) => setTab({ ...tab, nameDe: e.target.value })} />
        </div>
        <div className="grid gap-2">
          <Label>Slug (URL) {tab.isBuiltin && "(Nicht änderbar bei Built-in)"}</Label>
          <Input
            value={tab.slug}
            disabled={tab.isBuiltin}
            onChange={(e) => setTab({ ...tab, slug: e.target.value })}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={tab.isVisible}
              onCheckedChange={(v) => setTab({ ...tab, isVisible: v })}
            />
            <Label>Sichtbar im Header</Label>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Reihenfolge (Sortierung)</Label>
          <Input
            type="number"
            value={tab.order}
            onChange={(e) => setTab({ ...tab, order: parseInt(e.target.value) || 0 })}
          />
        </div>

        {!tab.isBuiltin && (
          <div className="mc-panel p-6 mt-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-accent">Module (Inhalt der Seite)</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Hier kannst du Text, Rezepte oder andere Verlinkungen für diesen Tab hinzufügen. Bei
              Rezepten/Bossen trägst du die UUID aus der Datenbank in das Feld ein.
            </p>

            {tab.modules.map((m, i) => (
              <div key={i} className="border border-border p-3 flex flex-col gap-2 relative group">
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                  onClick={() => removeModule(i)}
                >
                  X
                </Button>
                <div className="text-xs text-accent font-bold uppercase">{m.type}</div>
                {m.type === "text" ? (
                  <div data-color-mode="dark">
                    <MDEditor
                      value={m.contentDe || ""}
                      onChange={(val) => updateModule(i, { contentDe: val })}
                      previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
                      height={200}
                    />
                  </div>
                ) : (
                  <EntityPicker
                    type={m.type}
                    value={m.id || ""}
                    onChange={(id, label) => updateModule(i, { id })}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2 flex-wrap mt-2">
              <Button variant="outline" size="sm" onClick={() => addModule("text")}>
                + Text
              </Button>
              <Button variant="outline" size="sm" onClick={() => addModule("recipe")}>
                + Rezept
              </Button>
              <Button variant="outline" size="sm" onClick={() => addModule("boss")}>
                + Boss
              </Button>
              <Button variant="outline" size="sm" onClick={() => addModule("item")}>
                + Item
              </Button>
              <Button variant="outline" size="sm" onClick={() => addModule("command")}>
                + Befehl
              </Button>
            </div>
          </div>
        )}
      </div>

      <DiffModal
        isOpen={showDiff}
        onClose={() => setShowDiff(false)}
        onConfirm={confirmSave}
        oldData={originalTab || {}}
        newData={tab}
      />
    </div>
  );
}
