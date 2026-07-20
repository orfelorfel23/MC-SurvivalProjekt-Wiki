import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, Navigate, useLocation } from "@tanstack/react-router";
import { getUsersAndRoles, grantRole, revokeRole } from "@/server/functions";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const location = useLocation();
  const { lang } = useLang();

  const load = async () => {
    try {
      const data = await getUsersAndRoles();
      setUsers(data ?? []);
    } catch (e: any) {
      toast.error(t("loadFailed", lang) + e.message);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!user) return <Navigate to="/auth" search={{ from: location.pathname }} />;
  if (!isAdmin) return <div className="container mx-auto px-4 py-8">{t("noAdminAccess", lang)}</div>;

  const handleGrant = async (userId: string, role: "ADMIN" | "MODERATOR" | "EDITOR") => {
    try {
      await grantRole({ data: { userId, role } });
      toast.success(t("roleGranted", lang));
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeRole({ data: { id } });
      toast.success(t("removed", lang));
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-primary">{t("adminDashboard", lang)}</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/broken-links">{t("brokenLinks", lang)}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/trash">{t("openTrash", lang)}</Link>
          </Button>
        </div>
      </div>
      <section className="mc-panel p-4 mb-6">
        <h2 className="text-sm uppercase text-accent mb-3">{t("appointEditor", lang)}</h2>
        <p className="text-xs text-muted-foreground mb-3">
          {t("appointEditorDesc", lang)}
        </p>
        <div className="space-y-2">
          {users.map((u) => {
            const userRoles = u.roles || [];
            return (
              <div key={u.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{u.name ?? u.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {userRoles.map((r: any) => r.role).join(", ") || t("noRole", lang)}
                  </div>
                </div>
                {!userRoles.find((r: any) => r.role === "EDITOR") && (
                  <Button size="sm" variant="outline" onClick={() => handleGrant(u.id, "EDITOR")}>
                    + Editor
                  </Button>
                )}
                {!userRoles.find((r: any) => r.role === "MODERATOR") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGrant(u.id, "MODERATOR")}
                  >
                    + Moderator
                  </Button>
                )}
                {!userRoles.find((r: any) => r.role === "ADMIN") && (
                  <Button size="sm" variant="outline" onClick={() => handleGrant(u.id, "ADMIN")}>
                    + Admin
                  </Button>
                )}
                {userRoles.map((r: any) => (
                  <Button
                    key={r.id}
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevoke(r.id)}
                  >
                    − {r.role}
                  </Button>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
