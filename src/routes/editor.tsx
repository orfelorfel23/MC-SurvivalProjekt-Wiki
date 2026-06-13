import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { KINDS, KIND_LABEL_KEY, t, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/editor")({
  component: EditorHome,
});

function EditorHome() {
  const { isEditor, loading } = useAuth();
  const { lang } = useLang();
  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!isEditor) return (
    <div className="container mx-auto px-4 py-8 max-w-md mc-panel">
      <h1 className="text-lg text-primary mb-2">Kein Zugriff</h1>
      <p className="text-sm text-muted-foreground">Nur Editoren können Inhalte bearbeiten. Frag einen Admin, dir die Editor-Rolle zu geben.</p>
    </div>
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl text-primary mb-2">Editor</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Inhalte werden direkt in den Tabellen verwaltet. Du kannst sie über die Cloud-Konsole hinzufügen,
        oder mir sagen, was du anlegen möchtest – ich kann strukturierte Editor-Formulare im nächsten Schritt hinzufügen.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {KINDS.map((k) => (
          <Link key={k} to="/$kind" params={{ kind: k }} className="mc-panel p-4 hover:bg-accent/10">
            <div className="font-bold">{t(KIND_LABEL_KEY[k], lang)}</div>
            <div className="text-xs text-muted-foreground">Ansicht & Verwaltung</div>
          </Link>
        ))}
      </div>
    </div>
  );
}