import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type GridSlot = { item_id: string | null; count?: number } | null;

export type GridItem = {
  id: string;
  slug: string;
  name_de: string;
  name_en: string | null;
  image_url: string | null;
  enchanted: boolean;
};

export function CraftingGrid({
  grid,
  result,
  resultCount = 1,
  items,
  shaped = true,
}: {
  grid: GridSlot[];
  result?: GridItem | null;
  resultCount?: number;
  items: Record<string, GridItem>;
  shaped?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className={cn("mc-panel p-3 grid grid-cols-3 gap-1.5", !shaped && "opacity-95")}>
        {Array.from({ length: 9 }).map((_, i) => {
          const slot = grid[i];
          const item = slot?.item_id ? items[slot.item_id] : null;
          return <Slot key={i} item={item} count={slot?.count} />;
        })}
      </div>
      <div className="text-2xl text-muted-foreground">→</div>
      <div className="mc-panel p-3">
        <Slot item={result ?? null} count={resultCount} large />
      </div>
    </div>
  );
}

function Slot({ item, count, large }: { item: GridItem | null; count?: number; large?: boolean }) {
  const size = large ? "w-20 h-20" : "w-14 h-14";
  if (!item) {
    return <div className={cn("mc-slot", size)} />;
  }
  return (
    <Link
      to="/$kind/$slug"
      params={{ kind: "items", slug: item.slug }}
      className={cn("mc-slot relative flex items-center justify-center group", size, item.enchanted && "mc-glint")}
      title={item.name_de}
    >
      {item.image_url ? (
        <img src={item.image_url} alt={item.name_de} className="w-3/4 h-3/4 object-contain relative z-0" style={{ imageRendering: "pixelated" }} />
      ) : (
        <span className="text-[10px] text-center px-1 text-muted-foreground relative z-0">{item.name_de.slice(0, 8)}</span>
      )}
      {count && count > 1 ? (
        <span className="absolute bottom-0.5 right-1 text-xs font-bold text-white drop-shadow z-10">{count}</span>
      ) : null}
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-popover border border-border px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {item.name_de}
      </span>
    </Link>
  );
}