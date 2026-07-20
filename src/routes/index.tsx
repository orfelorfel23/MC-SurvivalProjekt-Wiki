import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useLang, t, KINDS, KIND_LABEL_KEY } from "@/lib/i18n";
import { ServerStatus } from "@/components/server-status";
import { SkinViewer } from "@/components/skin-viewer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minecraft Server Wiki" },
      {
        name: "description",
        content:
          "Befehle, Custom-Items, Crafting-Rezepte, Bosse, Aufgaben, Pets und mehr für unseren Minecraft-Server.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { lang } = useLang();
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="mc-panel p-8 md:p-12 mb-10 text-center relative overflow-hidden">
        <div className="mc-grass-bar absolute top-0 left-0 right-0" />
        <h1 className="text-2xl md:text-4xl mb-4 text-primary mt-4">Server Wiki</h1>
        <p
          className="text-foreground/90 text-sm max-w-xl mx-auto"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "0.7rem", lineHeight: 1.8 }}
        >
          {t("tagline", lang)}
        </p>
        <p
          className="text-xs text-muted-foreground mt-3 font-sans"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {t("heroSub", lang)}
        </p>
        <div className="mt-8 max-w-4xl mx-auto text-left grid md:grid-cols-2 gap-6 items-start">
          <ServerStatus />
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <SkinViewer name="orfel" role="Server Owner" />
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-xs uppercase tracking-widest text-accent mb-4">
          {t("quickLinks", lang)}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KINDS.map((k) => (
            <Link
              key={k}
              to={"/$kind" as never}
              params={{ kind: k } as never}
              className="mc-panel p-4 hover:bg-accent/10 transition-colors text-center"
            >
              <div className="text-sm font-bold">{t(KIND_LABEL_KEY[k], lang)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
