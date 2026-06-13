import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useLang, t, KINDS, KIND_LABEL_KEY } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minecraft Server Wiki" },
      { name: "description", content: "Befehle, Custom-Items, Crafting-Rezepte, Bosse, Aufgaben, Pets und mehr für unseren Minecraft-Server." },
    ],
  }),
  component: Index,
});

function Index() {
  const { lang } = useLang();
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl mb-4 text-primary">Server Wiki</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("tagline", lang)}</p>
        <p className="text-sm text-muted-foreground mt-2">{t("heroSub", lang)}</p>
      </section>
      <section>
        <h2 className="text-sm uppercase tracking-widest text-accent mb-4">{t("quickLinks", lang)}</h2>
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
