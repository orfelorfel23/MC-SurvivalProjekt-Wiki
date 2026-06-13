import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [targetEmail, setTargetEmail] = useState("");

  const load = async () => {
    const { data: rs } = await supabase.from("user_roles").select("*");
    setRoles(rs ?? []);
    const { data: ps } = await supabase.from("profiles").select("id,display_name");
    setProfiles(ps ?? []);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="container mx-auto px-4 py-8">...</div>;
  if (!user) return <div className="container mx-auto px-4 py-8">Bitte anmelden.</div>;
  if (!isAdmin) return <div className="container mx-auto px-4 py-8">Kein Admin-Zugriff.</div>;

  const grant = async (userId: string, role: "admin" | "editor") => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message); else { toast.success("Rolle vergeben"); load(); }
  };
  const revoke = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Entfernt"); load(); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl text-primary mb-6">Admin</h1>
      <section className="mc-panel p-4 mb-6">
        <h2 className="text-sm uppercase text-accent mb-3">Editor ernennen</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Suche unten den Nutzer, dem du eine Rolle geben willst. Nutzer erscheinen hier, sobald sie sich einmal angemeldet haben.
        </p>
        <div className="space-y-2">
          {profiles.map((p) => {
            const userRoles = roles.filter((r) => r.user_id === p.id);
            return (
              <div key={p.id} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{p.display_name ?? p.id}</div>
                  <div className="text-xs text-muted-foreground">{userRoles.map((r) => r.role).join(", ") || "keine Rolle"}</div>
                </div>
                {!userRoles.find((r) => r.role === "editor") && (
                  <Button size="sm" variant="outline" onClick={() => grant(p.id, "editor")}>+ Editor</Button>
                )}
                {!userRoles.find((r) => r.role === "admin") && (
                  <Button size="sm" variant="outline" onClick={() => grant(p.id, "admin")}>+ Admin</Button>
                )}
                {userRoles.map((r) => (
                  <Button key={r.id} size="sm" variant="destructive" onClick={() => revoke(r.id)}>− {r.role}</Button>
                ))}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}