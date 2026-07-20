import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ItemTooltip } from "@/components/item-tooltip";

export type GridSlot = {
  type?: "db" | "vanilla";
  item_id?: string | null;
  mc_id?: string;
  name?: string;
  enchanted?: boolean;
  count?: number;
} | null;

export type GridItem = {
  id: string;
  slug: string;
  name_de: string;
  name_en?: string | null;
  nameDe?: string;
  nameEn?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  enchanted?: boolean;
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 flex-wrap">
        <div className={cn("mc-panel p-3 grid grid-cols-3 gap-1.5", !shaped && "opacity-95")}>
          {Array.from({ length: 9 }).map((_, i) => {
            const slot = grid[i];
            return <Slot key={i} slot={slot} dbItems={items} />;
          })}
        </div>
        <div className="text-2xl text-muted-foreground">→</div>
        <div className="mc-panel p-3 relative">
          <Slot
            slot={result ? { type: "db", item_id: result.id, count: resultCount } : null}
            dbItems={{ [result?.id || ""]: result as any }}
            large
          />
        </div>
      </div>
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <span
          className={cn(
            "inline-block w-2 h-2 rounded-full",
            shaped ? "bg-blue-500/80" : "bg-orange-500/80",
          )}
        />
        {shaped ? "Geformtes Rezept (Anordnung wichtig)" : "Ungeformtes Rezept (Anordnung egal)"}
      </div>
    </div>
  );
}

function Slot({
  slot,
  dbItems,
  large,
}: {
  slot: GridSlot;
  dbItems?: Record<string, GridItem>;
  large?: boolean;
}) {
  const size = large ? "w-20 h-20" : "w-14 h-14";
  if (!slot) {
    return <div className={cn("mc-slot", size)} />;
  }

  const isVanilla = slot.type === "vanilla" || !!slot.mc_id;
  const dbItem = !isVanilla && slot.item_id && dbItems ? dbItems[slot.item_id] : null;

  const imageUrl = isVanilla
    ? `/items/${slot.mc_id}.png`
    : dbItem?.image_url || dbItem?.imageUrl;
  const name = isVanilla ? slot.name || slot.mc_id : dbItem?.name_de || dbItem?.nameDe;
  const enchanted = isVanilla ? slot.enchanted : dbItem?.enchanted;
  const count = slot.count;

  if (!isVanilla && !dbItem) {
    return <div className={cn("mc-slot", size)} />;
  }

  const inner = (
    <>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-3/4 h-3/4 object-contain relative z-0"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <span className="text-[10px] text-center px-1 text-muted-foreground relative z-0">
          {name?.slice(0, 8)}
        </span>
      )}
      {count && count > 1 ? (
        <span className="absolute bottom-0.5 right-1 text-xs font-bold text-white drop-shadow z-10">
          {count}
        </span>
      ) : null}
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-popover border border-border px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {name}
      </span>
    </>
  );

  const className = cn(
    "mc-slot relative flex items-center justify-center group",
    size,
    enchanted && "mc-glint",
  );

  if (isVanilla || !dbItem) {
    return (
      <ItemTooltip item={dbItem}>
        <div className={className}>{inner}</div>
      </ItemTooltip>
    );
  }

  return (
    <ItemTooltip item={dbItem}>
      <Link to="/$kind/$slug" params={{ kind: "items", slug: dbItem.slug }} className={className}>
        {inner}
      </Link>
    </ItemTooltip>
  );
}
