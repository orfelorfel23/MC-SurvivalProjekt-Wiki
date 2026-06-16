import { useEffect, useState } from "react";
import { useLang, t } from "@/lib/i18n";

export function ServerStatus() {
  const { lang } = useLang();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // We use a demo server IP for now, users can change it to their actual server IP.
  const SERVER_IP = "mc.hypixel.net";

  useEffect(() => {
    fetch(`https://api.mcsrvstat.us/3/${SERVER_IP}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mc-panel p-4 flex items-center justify-center animate-pulse">
        <div className="text-xs text-muted-foreground">{t("loading", lang)}...</div>
      </div>
    );
  }

  if (!status || !status.online) {
    return (
      <div className="mc-panel p-4 flex flex-col items-center justify-center border-red-900">
        <div className="text-red-500 font-bold text-sm mb-1">Server Offline</div>
        <div className="text-xs text-muted-foreground">{SERVER_IP} is currently unreachable.</div>
      </div>
    );
  }

  return (
    <div className="mc-panel p-4 flex flex-col gap-2 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-2 h-full bg-green-500/20" />
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold text-primary flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Server Online
        </div>
        <div className="text-xs font-mono bg-background/50 px-2 py-1 rounded border border-border">
          {SERVER_IP}
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Players: <strong className="text-accent">{status.players?.online || 0}</strong> / {status.players?.max || 0}</span>
        <span>Version: {status.version}</span>
      </div>
      
      {status.motd?.clean && status.motd.clean.length > 0 && (
        <div className="mt-2 text-[10px] font-mono whitespace-pre-wrap opacity-80 border-t border-border/50 pt-2">
          {status.motd.clean.join("\n")}
        </div>
      )}
    </div>
  );
}
