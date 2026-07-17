import { cn } from "@/lib/utils";

const rarityColors = {
  COMMON: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]",
  UNCOMMON: "text-green-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]",
  RARE: "text-blue-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]",
  EPIC: "text-purple-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]",
  LEGENDARY: "text-yellow-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]",
  MYTHIC: "text-pink-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]",
};

export function RarityBadge({ rarity, className }: { rarity?: string | null; className?: string }) {
  if (!rarity) return null;

  const colorClass = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.COMMON;

  return (
    <span className={cn("font-bold uppercase tracking-wider text-xs", colorClass, className)}>
      {rarity}
    </span>
  );
}
