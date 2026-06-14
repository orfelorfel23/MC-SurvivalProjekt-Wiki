import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/editor")({
  component: EditorLayout,
});

function EditorLayout() {
  const { isEditor, loading } = useAuth();
  
  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md mc-panel">
        <h1 className="text-lg text-primary mb-2">Kein Zugriff</h1>
        <p className="text-sm text-muted-foreground">
          Nur Editoren können Inhalte bearbeiten. Frag einen Admin, dir die Editor-Rolle zu geben.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Outlet />
    </div>
  );
}
