import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { getRecentlyViewed, saveRecentlyViewed } from "@/server/functions";

export type ViewedItem = {
  kind: string;
  slug: string;
  title: string;
  timestamp: number;
};

export function useRecentlyViewed(currentItem?: { kind: string; slug: string; title: string }) {
  const { user } = useAuth();
  const [history, setHistory] = useState<ViewedItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let initial: ViewedItem[] = [];
    
    const init = async () => {
      if (user) {
        try {
          const data = await getRecentlyViewed({ data: { userId: user.id } });
          initial = Array.isArray(data) ? data : [];
        } catch (e) {
          console.error(e);
        }
      } else {
        const local = localStorage.getItem("recentlyViewed");
        initial = local ? JSON.parse(local) : [];
      }

      if (currentItem) {
        initial = initial.filter((i) => !(i.kind === currentItem.kind && i.slug === currentItem.slug));
        initial.unshift({ ...currentItem, timestamp: Date.now() });
        if (initial.length > 5) initial = initial.slice(0, 5);
        
        if (user) {
          saveRecentlyViewed({ data: { userId: user.id, history: initial } }).catch(console.error);
        } else {
          localStorage.setItem("recentlyViewed", JSON.stringify(initial));
        }
      }

      setHistory(initial);
      setInitialized(true);
    };

    init();
  }, [currentItem?.kind, currentItem?.slug, user?.id]);

  return { history, initialized };
}
