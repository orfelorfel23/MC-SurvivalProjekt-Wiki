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

  // 1. Fetch initial data on mount (or when user changes)
  useEffect(() => {
    let isMounted = true;
    const fetchInit = async () => {
      let initial: ViewedItem[] = [];
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
      
      if (isMounted) {
        // Deduplicate initial history
        const uniqueInitial = [];
        const seen = new Set();
        for (const item of initial) {
          const key = item.kind.toLowerCase() + ":" + item.slug.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueInitial.push(item);
          }
        }
        setHistory(uniqueInitial);
        setInitialized(true);
      }
    };

    fetchInit();
    return () => { isMounted = false; };
  }, [user?.id]);

  // 2. Add current item when initialized and currentItem changes
  useEffect(() => {
    if (!initialized || !currentItem) return;

    setHistory((prev) => {
      // Case-insensitive filtering to prevent duplicates from URL casing issues
      const currentKind = currentItem.kind.toLowerCase();
      const currentSlug = currentItem.slug.toLowerCase();
      
      // Check if we even need to update (if the very first item is already this item)
      if (
        prev.length > 0 &&
        prev[0].kind.toLowerCase() === currentKind &&
        prev[0].slug.toLowerCase() === currentSlug &&
        prev[0].title === currentItem.title
      ) {
        return prev;
      }

      const filtered = prev.filter(
        (i) => !(i.kind.toLowerCase() === currentKind && i.slug.toLowerCase() === currentSlug)
      );
      
      const updated = [{ ...currentItem, timestamp: Date.now() }, ...filtered].slice(0, 5);

      if (user) {
        saveRecentlyViewed({ data: { userId: user.id, history: updated } }).catch(console.error);
      } else {
        localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      }

      return updated;
    });
  }, [currentItem?.kind, currentItem?.slug, currentItem?.title, initialized, user?.id]);

  const remove = (kind: string, slug: string) => {
    setHistory((prev) => {
      const k = kind.toLowerCase();
      const s = slug.toLowerCase();
      const updated = prev.filter((i) => !(i.kind.toLowerCase() === k && i.slug.toLowerCase() === s));
      
      if (user) {
        saveRecentlyViewed({ data: { userId: user.id, history: updated } }).catch(console.error);
      } else {
        localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      }
      return updated;
    });
  };

  return { history, initialized, remove };
}
