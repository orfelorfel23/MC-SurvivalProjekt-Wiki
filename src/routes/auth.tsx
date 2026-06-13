import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Anmelden · Server Wiki" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account erstellt. Du kannst dich jetzt anmelden.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Willkommen zurück!");
        nav({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Login fehlgeschlagen");
    else if (!r.redirected) nav({ to: "/" });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="mc-panel p-6">
        <h1 className="text-xl mb-4 text-primary">{mode === "signin" ? "Anmelden" : "Registrieren"}</h1>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail"
            className="w-full px-3 py-2 rounded bg-input border border-border" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort"
            className="w-full px-3 py-2 rounded bg-input border border-border" />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "..." : mode === "signin" ? "Anmelden" : "Registrieren"}
          </Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">oder</div>
        <Button variant="outline" className="w-full" onClick={google}>Mit Google fortfahren</Button>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="block w-full mt-4 text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Noch kein Konto? Registrieren" : "Bereits Konto? Anmelden"}
        </button>
      </div>
    </div>
  );
}