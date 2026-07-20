import { useLang, t } from "@/lib/i18n";

export interface SkinViewerProps {
  name: string;
  type?: "player" | "mob";
  role?: string;
  imageUrl?: string;
}

export function SkinViewer({ name, type = "player", role, imageUrl }: SkinViewerProps) {
  const { lang } = useLang();

  // For players, we default to mc-heads.net. For mobs, we can either use the provided imageUrl
  // or a fallback local path like /images/mobs/villager.png
  const imageSrc = imageUrl 
    ? imageUrl 
    : type === "player" 
      ? `https://mc-heads.net/body/${name}` 
      : `/images/mobs/${name.toLowerCase()}.png`;

  return (
    <div className="mc-panel p-4 flex flex-col items-center gap-2 w-full max-w-[240px] mx-auto bg-card border border-border">
      <h3 className="text-primary font-bold text-center text-lg">{name}</h3>
      {role && <p className="text-xs text-accent font-semibold uppercase tracking-wider mb-2 text-center">{role}</p>}

      <div className="w-32 h-64 bg-black/50 border border-border rounded flex items-center justify-center p-2">
        <img
          src={imageSrc}
          alt={name}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (type === "player" && !target.src.includes("Steve")) {
              target.src = "https://mc-heads.net/body/Steve";
            } else if (type === "mob") {
              // Fallback for missing mob image
              target.style.opacity = "0.5";
            }
          }}
        />
      </div>

      {type === "player" && !imageUrl && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">Powered by MC-Heads</p>
      )}
    </div>
  );
}
