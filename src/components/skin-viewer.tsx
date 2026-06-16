import { useState } from "react";
import { useLang, t } from "@/lib/i18n";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

export function SkinViewer() {
  const { lang } = useLang();
  const [username, setUsername] = useState("Steve");
  const [debouncedUsername, setDebouncedUsername] = useState("Steve");

  // Debounce the input slightly to avoid spamming the API while typing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedUsername(username || "Steve");
    }
  };

  return (
    <div className="mc-panel p-6 flex flex-col items-center gap-4 w-full max-w-sm mx-auto bg-card border border-border">
      <h3 className="text-primary font-bold text-center">Spieler Skin Viewer</h3>
      
      <div className="relative w-full max-w-[200px]">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          className="pl-8 bg-background border-border"
          placeholder="Minecraft Name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setDebouncedUsername(username || "Steve")}
        />
      </div>

      <div className="w-32 h-64 bg-black/50 border border-border rounded flex items-center justify-center p-2 mt-2">
        <img 
          src={`https://crafatar.com/renders/body/${debouncedUsername}?overlay=true`} 
          alt={`${debouncedUsername}'s Skin`}
          className="max-h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://crafatar.com/renders/body/Steve?overlay=true";
          }}
        />
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Powered by Crafatar
      </p>
    </div>
  );
}
