import { createFileRoute, Outlet, Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/editor")({
  component: EditorLayout,
});

function EditorLayout() {
  const { user, isEditor, loading } = useAuth();
  const location = useLocation();
  const { lang } = useLang();

  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!user) {
    return <Navigate to="/login" search={{ from: location.pathname }} />;
  }
  if (!isEditor) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md mc-panel">
        <h1 className="text-lg text-primary mb-2">{t("noAccess", lang)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("noEditorAccessDesc", lang)}
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
