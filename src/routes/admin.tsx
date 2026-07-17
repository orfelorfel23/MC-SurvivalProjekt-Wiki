import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { getUsersAndRoles, grantRole, revokeRole } from "@/server/functions";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    try {
      const data = await getUsersAndRoles();
      setUsers(data ?? []);
    } catch (e: any) {
      toast.error("Laden fehlgeschlagen: " + e.message);
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!user) return <div className="container mx-auto px-4 py-8">Bitte anmelden.</div>;
  if (!isAdmin) return <div className="container mx-auto px-4 py-8">Kein Admin-Zugriff.</div>;

  const handleGrant = async (userId: string, role: "ADMIN" | "MODERATOR" | "EDITOR") => {
    try {
      await grantRole({ data: { userId, role } });
      toast.success("Rolle vergeben");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeRole({ data: { id } });
      toast.success("Entfernt");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-primary">Admin</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/broken-links">Broken Links</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/trash">Papierkorb öffnen</Link>
          </Button>
        </div>
      </div>
      <section className="mc-panel p-4 mb-6">
        <h2 className="text-sm uppercase text-accent mb-3">Editor ernennen</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Suche unten den Nutzer, dem du eine Rolle geben willst. Nutzer erscheinen hier, sobald sie
          sich einmal angemeldet haben.
        </p>
        <div className="space-y-2">
          {users.map((u) => {
            const userRoles = u.roles || [];
            return (
              <div key={u.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{u.name ?? u.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {userRoles.map((r: any) => r.role).join(", ") || "keine Rolle"}
                  </div>
                </div>
                {!userRoles.find((r: any) => r.role === "EDITOR") && (
                  <Button size="sm" variant="outline" onClick={() => handleGrant(u.id, "EDITOR")}>
                    + Editor
                  </Button>
                )}
                {!userRoles.find((r: any) => r.role === "MODERATOR") && (
                  <Button size="sm" variant="outline" onClick={() => handleGrant(u.id, "MODERATOR")}>
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
