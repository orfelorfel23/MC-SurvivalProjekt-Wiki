import { createFileRoute } from "@tanstack/react-router";
import { useLang, t } from "@/lib/i18n";

export const Route = createFileRoute("/karte")({
  component: MapPage,
});

function MapPage() {
  const { lang } = useLang();

  // Replace this with the actual Dynmap or BlueMap URL
  const MAP_URL = "https://map.hypixel.net"; // Example demo map

  return (
    <div className="container mx-auto px-4 py-8 h-[80vh] flex flex-col">
      <h1 className="text-2xl text-primary mb-4">Live Server Karte</h1>
      <div className="flex-1 bg-black/50 border border-border rounded-lg overflow-hidden relative mc-panel p-1">
        <iframe
          src={MAP_URL}
          className="w-full h-full border-0"
          title="Server Map"
          allowFullScreen
        />
        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur px-2 py-1 text-xs rounded border border-border pointer-events-none">
          Powered by Dynmap/BlueMap
        </div>
      </div>
    </div>
  );
}
