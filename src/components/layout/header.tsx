import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, LogIn, LogOut, Shield, Languages, Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { useLang, t, KINDS, KIND_LABEL_KEY } from "@/lib/i18n";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { getWikiTabs } from "@/server/functions";
import { Button } from "@/components/ui/button";

export function Header() {
  const { lang, setLang } = useLang();
  const { user, isEditor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: tabs, isLoading: tabsLoading } = useQuery({
    queryKey: ["wikiTabs"],
    queryFn: () => getWikiTabs(),
    staleTime: 1000 * 60 * 60,
  });

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sound_muted") === "true";
    }
    return false;
  });

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("sound_muted", next.toString());
  };
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="container mx-auto px-4 py-2 flex items-stretch gap-4 md:gap-6">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img
            src="/icon.png"
            alt="Minecraft Server Wiki Logo"
            className="w-20 h-20 object-contain -my-2"
          />
        </Link>
        <div className="flex flex-col flex-1 justify-center gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2 justify-between w-full">
            <Link to="/" className="hidden md:block truncate">
              <span className="font-bold text-sm uppercase tracking-wider">Minecraft Server Wiki</span>
            </Link>
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (q.trim())
                    navigate({ to: "/search", search: { q: q.trim(), category: "", rarity: "" } });
                }}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <div className="relative w-full sm:w-48 md:w-64">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("searchPlaceholder", lang)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </form>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLang(lang === "de" ? "en" : "de")}
                title={t("switchLang", lang)}
              >
                <Languages className="w-4 h-4" /> {lang.toUpperCase()}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleDark} title={t("toggleDark", lang)}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMute} title={t("toggleSound", lang)}>
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              {isEditor && (
                <Link to="/editor">
                  <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4" /> {t("editor", lang)}
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    {t("admin", lang)}
                  </Button>
                </Link>
              )}
              {authLoading ? (
                <div className="w-20 h-8 bg-muted animate-pulse rounded" />
              ) : user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await authClient.signOut();
                  }}
                >
                  <LogOut className="w-4 h-4 hidden sm:inline-block" /> {t("logout", lang)}
                </Button>
              ) : (
                <Link to="/auth" search={{ from: undefined }}>
                  <Button size="sm">
                    <LogIn className="w-4 h-4 hidden sm:inline-block" /> {t("login", lang)}
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <nav className="flex items-center gap-1 text-sm flex-wrap w-full mt-1">
          {tabsLoading ? (
            <div className="flex gap-2">
              <div className="w-16 h-6 bg-muted animate-pulse rounded" />
              <div className="w-16 h-6 bg-muted animate-pulse rounded" />
              <div className="w-16 h-6 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <>
              {KINDS.map((k) => {
                const dbTab = tabs?.find((t) => t.slug === k);
                if (dbTab && !dbTab.isVisible) return null;
                return (
                  <Link
                    key={k}
                    to={"/$kind" as never}
                    params={{ kind: k } as never}
                    className="px-2 py-1 rounded hover:bg-accent/20 hover:text-accent transition-colors"
                    activeProps={{ className: "text-accent" }}
                  >
                    {dbTab ? (lang === "de" ? dbTab.nameDe : dbTab.nameEn || dbTab.nameDe) : t(KIND_LABEL_KEY[k], lang)}
                  </Link>
                );
              })}
              {tabs
                ?.filter((t) => !t.isBuiltin && t.isVisible)
                .map((t) => (
                  <Link
                    key={t.slug}
                    to={"/$kind" as never}
                    params={{ kind: t.slug } as never}
                    className="px-2 py-1 rounded hover:bg-accent/20 hover:text-accent transition-colors"
                    activeProps={{ className: "text-accent" }}
                  >
                    {lang === "de" ? t.nameDe : t.nameEn || t.nameDe}
                  </Link>
                ))}
            </>
          )}
          <Link
            to={(lang === "de" ? "/karte" : "/map") as never}
            className="px-2 py-1 rounded hover:bg-accent/20 hover:text-accent transition-colors"
            activeProps={{ className: "text-accent" }}
          >
            {t("map", lang)}
          </Link>
        </nav>
        </div>
      </div>
      <div className="mc-grass-bar" />
    </header>
  );
}
