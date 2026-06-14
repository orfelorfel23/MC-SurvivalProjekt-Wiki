import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { searchWiki } from "@/server/functions";

type Row = { kind: string; slug: string; title: string; snippet: string; imageUrl: string | null };

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    searchWiki({ data: { q } }).then((data) => {
      setRows((data ?? []) as Row[]);
      setLoading(false);
    }).catch(console.error);
  }, [q]);

  const grouped = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.kind] ||= []).push(r);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-xl mb-6 text-primary">Suche: "{q}"</h1>
      {loading && <p className="text-muted-foreground">Lädt...</p>}
      {!loading && rows.length === 0 && q && <p className="text-muted-foreground">Keine Treffer.</p>}
      <div className="space-y-6">
        {Object.entries(grouped).map(([kind, list]) => (
          <section key={kind}>
            <h2 className="text-sm uppercase tracking-widest text-accent mb-2">{kind}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {list.map((r) => (
                <Link key={kind + r.slug} to="/$kind/$slug" params={{ kind, slug: r.slug }}
                  className="mc-panel p-3 hover:bg-accent/10 flex gap-3">
                  {r.imageUrl && <img src={r.imageUrl} alt="" className="w-12 h-12 object-contain mc-slot" />}
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