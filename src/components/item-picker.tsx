import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { getKindList, getVanillaItems } from "@/server/functions";
import type { GridSlot } from "./crafting-grid";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

let vanillaItemsCache: any[] | null = null;

export function ItemPicker({
  slot,
  onChange,
  onClear,
}: {
  slot: GridSlot;
  onChange: (s: GridSlot) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dbItems, setDbItems] = useState<any[]>([]);
  const [vanilla, setVanilla] = useState<any[]>([]);

  // Customization state for vanilla items
  const [customName, setCustomName] = useState("");
  const [enchanted, setEnchanted] = useState(false);
  const [selectedVanilla, setSelectedVanilla] = useState<any>(null);

  useEffect(() => {
    if (open) {
      getKindList({ data: { kindId: "items" } }).then(setDbItems);
      if (vanillaItemsCache) {
        setVanilla(vanillaItemsCache);
      } else {
        getVanillaItems()
          .then((d) => {
            vanillaItemsCache = d;
            setVanilla(d);
          })
          .catch(console.error);
      }
    }
  }, [open]);

  const query = q.toLowerCase();
  const filteredDb = dbItems.filter((i) => i.nameDe.toLowerCase().includes(query));
  const filteredVanilla = vanilla
    .filter((i) => i.name.toLowerCase().includes(query) || i.id.toLowerCase().includes(query))
    .slice(0, 50);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSelectedVanilla(null);
      }}
    >
      <DialogTrigger asChild>
        <button className="w-12 h-12 border border-border border-dashed flex items-center justify-center hover:bg-accent/10 relative group">
          {slot ? (
            slot.type === "db" ? (
              <div className="text-[10px] truncate max-w-full px-1">DB Item</div>
            ) : (
              <img
                src={`/item-icons/${slot.mc_id}.png`}
                className={`w-8 h-8 object-contain ${slot.enchanted ? "mc-glint" : ""}`}
                alt={slot.name || slot.mc_id}
                title={slot.name || slot.mc_id}
              />
            )
          ) : (
            <span className="text-muted-foreground opacity-30">+</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Item auswählen</DialogTitle>
        </DialogHeader>

        {selectedVanilla ? (
          <div className="flex flex-col gap-4 py-4 flex-1">
            <div className="flex items-center gap-4">
              <img
                src={selectedVanilla.url}
                className={`w-16 h-16 object-contain ${enchanted ? "mc-glint" : ""}`}
              />
              <div className="flex-1">
                <div className="font-bold">{selectedVanilla.name}</div>
                <div className="text-xs text-muted-foreground">{selectedVanilla.id}</div>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Custom Name (Optional)</Label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={selectedVanilla.name}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ench" checked={enchanted} onCheckedChange={setEnchanted} />
              <Label htmlFor="ench">Verzaubert (Glint)</Label>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button onClick={() => setSelectedVanilla(null)} variant="outline">
                Zurück
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  onChange({
                    type: "vanilla",
                    mc_id: selectedVanilla.id,
                    name: customName.trim() || selectedVanilla.name,
                    enchanted,
                  });
                  setOpen(false);
                }}
              >
                Übernehmen
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-hidden flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-6">
              {filteredDb.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-accent mb-2">Custom Items (DB)</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {filteredDb.map((item) => (
                      <button
                        key={item.id}
                        className="mc-panel p-2 flex flex-col items-center gap-1 hover:bg-accent/10"
                        onClick={() => {
                          onChange({ type: "db", item_id: item.id });
                          setOpen(false);
                        }}
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            className={`w-8 h-8 object-contain ${item.enchanted ? "mc-glint" : ""}`}
                          />
                        )}
                        <span className="text-[10px] text-center line-clamp-2">{item.nameDe}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-accent mb-2">Minecraft Items</h3>
                <div className="grid grid-cols-4 gap-2">
                  {filteredVanilla.map((item) => (
                    <button
                      key={item.id}
                      className="mc-panel p-2 flex flex-col items-center gap-1 hover:bg-accent/10"
                      onClick={() => {
                        setSelectedVanilla(item);
                        setCustomName("");
                        setEnchanted(false);
                      }}
                    >
                      <img src={item.url} className="w-8 h-8 object-contain" loading="lazy" />
                      <span className="text-[10px] text-center line-clamp-2">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {slot && (
              <Button
                variant="destructive"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
              >
                Item entfernen
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
