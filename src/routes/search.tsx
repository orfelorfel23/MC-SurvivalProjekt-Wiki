import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { searchWiki } from "@/server/functions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Row = { kind: string; slug: string; title: string; snippet: string; imageUrl: string | null };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    category: typeof s.category === "string" ? s.category : "",
    rarity: typeof s.rarity === "string" ? s.rarity : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, category, rarity } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  
  const [localQ, setLocalQ] = useState(q);
  const [localCategory, setLocalCategory] = useState(category || "all");
  const [localRarity, setLocalRarity] = useState(rarity || "all");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // If empty query and no filters, don't search immediately
    if (!q && (!category || category === "all") && (!rarity || rarity === "all")) {
      setRows([]);
      return;
    }
    
    setLoading(true);
    searchWiki({ data: { 
      q, 
      category: category && category !== "all" ? category : undefined, 
      rarity: rarity && rarity !== "all" ? rarity : undefined 
    } })
      .then((data) => {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      })
      .catch(console.error);
  }, [q, category, rarity]);

  // Sync back to URL
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ search: { q: localQ, category: localCategory, rarity: localRarity }, replace: true });
    }, 300);
  }, [localQ, localCategory, localRarity]);

  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.kind] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-primary">Erweiterte Suche</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex-1">
          <Input 
            placeholder="Suchbegriff..." 
            value={localQ} 
            onChange={(e) => setLocalQ(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={localCategory} onValueChange={setLocalCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Kategorie (Alle)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="waffen">Waffen</SelectItem>
              <SelectItem value="werkzeuge">Werkzeuge</SelectItem>
              <SelectItem value="ruestung">Rüstung</SelectItem>
              <SelectItem value="material">Material</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={localRarity} onValueChange={setLocalRarity}>
            <SelectTrigger>
              <SelectValue placeholder="Seltenheit (Alle)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Seltenheiten</SelectItem>
              <SelectItem value="COMMON">Common</SelectItem>
              <SelectItem value="UNCOMMON">Uncommon</SelectItem>
              <SelectItem value="RARE">Rare</SelectItem>
              <SelectItem value="EPIC">Epic</SelectItem>
              <SelectItem value="LEGENDARY">Legendary</SelectItem>
              <SelectItem value="MYTHIC">Mythic</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => { setLocalQ(""); setLocalCategory("all"); setLocalRarity("all"); }}>
          Reset
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Sucht...</p>}
      {!loading && rows.length === 0 && (q || (category && category !== "all") || (rarity && rarity !== "all")) && (
        <p className="text-muted-foreground">Keine Treffer für diese Filter.</p>
      )}
      
      <div className="space-y-6">
        {Object.entries(grouped).map(([kind, list]) => (
          <section key={kind}>
            <h2 className="text-sm uppercase tracking-widest text-accent mb-2">{kind} ({list.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((r) => (
                <Link
                  key={kind + r.slug}
                  to="/$kind/$slug"
                  params={{ kind, slug: r.slug }}
                  className="mc-panel p-3 hover:bg-accent/10 flex gap-3 transition-colors"
                >
                  {r.imageUrl && (
                    <img src={r.imageUrl} alt="" className="w-12 h-12 object-contain mc-slot" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{r.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.snippet}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
