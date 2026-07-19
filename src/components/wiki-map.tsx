import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon path issues with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface WikiPoi {
  id: string;
  nameDe: string;
  nameEn: string | null;
  descriptionDe: string | null;
  descriptionEn: string | null;
  x: number;
  y: number;
  z: number;
}

export function WikiMap({ pois }: { pois: WikiPoi[] }) {
  const { lang } = useLang();

  // Für echte Minecraft Live-Maps (wie Dynmap oder Pl3xMap) kann man hier die Tile-URL eintragen.
  // Aktuell zeigen wir OpenStreetMap als Platzhalter, bis die Dynmap läuft.
  // Häufig ist die LiveMap-URL etwas wie: "https://map.deinserver.de/tiles/world/{z}/{x}_{y}.png"
  const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Umrechnung von Minecraft Koordinaten (X, Z) auf Leaflet LatLng.
  // ACHTUNG: Das hängt stark vom verwendeten Map-Plugin ab (Dynmap, BlueMap etc.).
  // Für OSM-Platzhalter skalieren wir es runter, sonst landen die Koordinaten im nirgendwo.
  const mcToLatLng = (x: number, z: number): L.LatLngExpression => {
    // Platzhalter-Umrechnung für OSM (damit die POIs um Afrika [0,0] starten).
    return [z / 5000, x / 5000];
  };

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url={TILE_URL}
      />
      {pois.map((poi) => (
        <Marker key={poi.id} position={mcToLatLng(poi.x, poi.z)}>
          <Popup>
            <div className="font-bold text-lg mb-1">
              {lang === "en" && poi.nameEn ? poi.nameEn : poi.nameDe}
            </div>
            <div className="text-sm">
              {lang === "en" && poi.descriptionEn ? poi.descriptionEn : poi.descriptionDe}
            </div>
            <div className="mt-2 text-xs text-muted-foreground border-t pt-1">
              X: {poi.x} | Y: {poi.y} | Z: {poi.z}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function ClientWikiMap(props: { pois: WikiPoi[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full flex items-center justify-center bg-black/50 text-muted-foreground">Lade Karte...</div>;
  }

  return <WikiMap {...props} />;
}
