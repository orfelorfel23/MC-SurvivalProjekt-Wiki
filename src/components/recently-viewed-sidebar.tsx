import { Link } from "@tanstack/react-router";
import { useLang, t, KIND_LABEL_KEY, Kind } from "@/lib/i18n";
import { ViewedItem } from "@/lib/use-recently-viewed";

export function RecentlyViewedSidebar({ history }: { history: ViewedItem[] }) {
  const { lang } = useLang();

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="mc-panel p-4 sticky top-24">
        <h3 className="text-sm uppercase tracking-widest text-accent mb-4">
          {t("recentlyViewed", lang)}
        </h3>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("noEntriesYet", lang)}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h, i) => (
              <Link
                key={h.kind + h.slug + i}
                to="/$kind/$slug"
                params={{ kind: h.kind, slug: h.slug }}
                className="p-2 -mx-2 hover:bg-accent/10 rounded transition-colors"
                // Disable prefetch to prevent error boundary triggering for deleted items
                // The router will fetch on click, and if 404, it renders the Not Found page smoothly.
                preload={false}
              >
                <div className="text-sm font-medium truncate">{h.title}</div>
                <div className="text-xs text-muted-foreground uppercase">
                  {t(KIND_LABEL_KEY[h.kind as Kind], lang) || h.kind}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
