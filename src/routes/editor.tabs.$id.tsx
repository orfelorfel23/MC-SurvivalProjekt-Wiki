import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getWikiTabs, saveTab } from "@/server/functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize from "rehype-sanitize";
import { DiffModal } from "@/components/diff-modal";

export const Route = createFileRoute("/editor/tabs/$id")({
  component: TabEditorDetail,
});

function TabEditorDetail() {
  const { id } = Route.useParams();
  const { isEditor } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: tabs } = useQuery({
    queryKey: ["wikiTabs"],
    queryFn: () => getWikiTabs(),
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

  useEffect(() => {
    if (id !== "new" && tabs) {
      const existing = tabs.find(t => t.slug === id);
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
    setTab(prev => ({ ...prev, modules: [...prev.modules, { type, id: "", contentDe: "" }] }));
  };

  const updateModule = (index: number, changes: any) => {
    const newMods = [...tab.modules];
    newMods[index] = { ...newMods[index], ...changes };
    setTab(prev => ({ ...prev, modules: newMods }));
  };

  const removeModule = (index: number) => {
    const newMods = [...tab.modules];
    newMods.splice(index, 1);
    setTab(prev => ({ ...prev, modules: newMods }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl text-primary">{id === "new" ? "Neuer Tab" : "Tab bearbeiten"}</h1>
        <Button onClick={handleSaveInit}>Überprüfen & Speichern</Button>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label>Name (DE)</Label>
          <Input value={tab.nameDe} onChange={e => setTab({...tab, nameDe: e.target.value})} />
        </div>
        <div className="grid gap-2">
          <Label>Slug (URL) {tab.isBuiltin && "(Nicht änderbar bei Built-in)"}</Label>
          <Input value={tab.slug} disabled={tab.isBuiltin} onChange={e => setTab({...tab, slug: e.target.value})} />
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={tab.isVisible} onCheckedChange={v => setTab({...tab, isVisible: v})} />
            <Label>Sichtbar im Header</Label>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Reihenfolge (Sortierung)</Label>
          <Input type="number" value={tab.order} onChange={e => setTab({...tab, order: parseInt(e.target.value) || 0})} />
        </div>

        {!tab.isBuiltin && (
          <div className="mc-panel p-6 mt-4 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-accent">Module (Inhalt der Seite)</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Hier kannst du Text, Rezepte oder andere Verlinkungen für diesen Tab hinzufügen.
              Bei Rezepten/Bossen trägst du die UUID aus der Datenbank in das Feld ein.
            </p>
            
            {tab.modules.map((m, i) => (
              <div key={i} className="border border-border p-3 flex flex-col gap-2 relative group">
                <Button variant="destructive" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100" onClick={() => removeModule(i)}>X</Button>
                <div className="text-xs text-accent font-bold uppercase">{m.type}</div>
                {m.type === "text" ? (
                  <div data-color-mode="dark">
                    <MDEditor
                      value={m.contentDe || ""}
                      onChange={val => updateModule(i, { contentDe: val })}
                      previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
                      height={200}
                    />
                  </div>
                ) : (
                  <div className="grid gap-1">
                    <Label className="text-xs">{m.type} ID (aus der Datenbank)</Label>
                    <Input value={m.id} onChange={e => updateModule(i, { id: e.target.value })} />
                  </div>
                )}
              </div>
            ))}

            <div className="flex gap-2 flex-wrap mt-2">
              <Button variant="outline" size="sm" onClick={() => addModule("text")}>+ Text</Button>
              <Button variant="outline" size="sm" onClick={() => addModule("recipe")}>+ Rezept</Button>
              <Button variant="outline" size="sm" onClick={() => addModule("boss")}>+ Boss</Button>
              <Button variant="outline" size="sm" onClick={() => addModule("item")}>+ Item</Button>
              <Button variant="outline" size="sm" onClick={() => addModule("command")}>+ Befehl</Button>
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
