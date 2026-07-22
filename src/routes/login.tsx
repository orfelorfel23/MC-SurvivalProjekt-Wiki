import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLang, t } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      from: search.from as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Anmelden · Server Wiki" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const from = search.from || "/";
  const { lang } = useLang();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0],
        });
          if (error) throw new Error(error.message);
          toast.success(t("accountCreated", lang));
          await qc.invalidateQueries({ queryKey: ["session"] });
          nav({ to: from as never });
        } else {
          const { data, error } = await authClient.signIn.email({
            email,
            password,
          });
          if (error) throw new Error(error.message);
          toast.success(t("welcomeBack", lang));
          await qc.invalidateQueries({ queryKey: ["session"] });
          nav({ to: from as never });
        }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error", lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="mc-panel p-6">
        <h1 className="text-xl mb-4 text-primary">
          {mode === "signin" ? t("login", lang) : t("register", lang)}
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email", lang)}
            className="w-full px-3 py-2 rounded bg-input border border-border"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password", lang)}
            className="w-full px-3 py-2 rounded bg-input border border-border"
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "..." : mode === "signin" ? t("login", lang) : t("register", lang)}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="block w-full mt-4 text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? t("noAccount", lang) : t("hasAccount", lang)}
        </button>
      </div>
    </div>
  );
}
