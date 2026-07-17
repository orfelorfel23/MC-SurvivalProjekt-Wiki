import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLang, pickLocalized } from "@/lib/i18n";
import React from "react";

export function ItemTooltip({ item, children }: { item?: any; children: React.ReactNode }) {
  const { lang } = useLang();
  if (!item) return <>{children}</>;

  const title = pickLocalized(item.nameDe, item.nameEn, lang);
  const description = pickLocalized(item.descriptionDe, item.descriptionEn, lang);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="mc-panel p-3 border-border bg-background/95 backdrop-blur z-50 text-left max-w-xs pointer-events-none"
        >
          <div className="text-primary font-bold mb-1">{title}</div>

          <div className="flex gap-2 flex-wrap text-[10px] mb-2 opacity-80">
            {item.rarity && (
              <span className="border border-border px-1 rounded">{item.rarity}</span>
            )}
            {item.category && <span className="bg-muted px-1 rounded">{item.category}</span>}
          </div>

          {description && (
            <div className="text-xs text-muted-foreground whitespace-pre-wrap font-sans opacity-90 leading-relaxed">
              {description}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
