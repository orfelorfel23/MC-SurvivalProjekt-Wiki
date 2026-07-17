import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { checkBrokenLinks } from "@/server/functions";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/broken-links")({
  component: AdminBrokenLinksPage,
});

function AdminBrokenLinksPage() {
  const { user, isAdmin, loading } = useAuth();
  const [results, setResults] = useState<
    { location: string; text: string; link: string; valid: boolean }[] | null
  >(null);
  const [isRunning, setIsRunning] = useState(false);

  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!user || !isAdmin)
    return <div className="container mx-auto px-4 py-8">Kein Admin-Zugriff.</div>;

  const handleRun = async () => {
    setIsRunning(true);
    setResults(null);
    try {
      const data = await checkBrokenLinks();
      setResults(data);
      toast.success(`Überprüfung abgeschlossen! ${data.length} Links gefunden.`);
    } catch (e: any) {
      toast.error("Fehler: " + e.message);
    }
    setIsRunning(false);
  };

  const brokenLinks = results?.filter((r) => !r.valid) || [];
  const validLinksCount = (results?.length || 0) - brokenLinks.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-2xl text-primary">Broken-Link-Checker</h1>
      </div>

      <div className="mc-panel p-6 mb-8 flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Dieses Tool durchsucht alle Markdown-Texte in der Datenbank (Beschreibungen,
          Seiteninhalte) nach lokalen Links und prüft, ob die referenzierten Seiten (z. B. Items
          oder Rezepte) existieren.
        </p>
        <Button onClick={handleRun} disabled={isRunning} className="w-max">
          {isRunning ? "Prüfung läuft..." : "Prüfung starten"}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded flex-1 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <div className="text-2xl font-bold">{validLinksCount}</div>
                <div className="text-xs uppercase">Gültige Links</div>
              </div>
            </div>
            <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded flex-1 flex items-center gap-3">
              <XCircle className="w-6 h-6" />
              <div>
                <div className="text-2xl font-bold">{brokenLinks.length}</div>
                <div className="text-xs uppercase">Tote Links</div>
              </div>
            </div>
          </div>

          {brokenLinks.length > 0 && (
            <div className="mc-panel p-4">
              <h2 className="text-lg font-bold text-red-400 mb-4">Gefundene tote Links</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Ort</th>
                      <th className="px-4 py-3">Link-Text</th>
                      <th className="px-4 py-3">Ziel-URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brokenLinks.map((link, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{link.location}</td>
                        <td className="px-4 py-3">{link.text}</td>
                        <td className="px-4 py-3 text-red-400 font-mono">{link.link}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
