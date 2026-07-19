# Minecraft Items Fetcher

Dieses Skript (`fetch-mc-items.ts`) automatisiert den Download aller Vanilla-Minecraft-Items und -Blöcke in Originalqualität direkt vom offiziellen Minecraft Wiki.

## Funktionsweise
1. Das Skript greift auf die zentrale Minecraft-Datenbank des Open-Source-Projekts `minecraft-data` (PrismarineJS) zu, um eine Liste aller aktuell verfügbaren Vanilla-Gegenstände zu erhalten.
2. Für jeden Gegenstand fragt das Skript über die MediaWiki-API des offiziellen Minecraft Wikis den exakten Dateinamen des Artikelbildes an (dies garantiert, dass wir z.B. für Blöcke die hochwertigen isometrischen 3D-Bilder erhalten).
3. Die Bilder werden heruntergeladen und lokal unter `public/items/<id>.png` gespeichert.
4. Abschließend generiert das Skript vollautomatisch die Datei `public/mc-items.json`, welche als Zuordnungstabelle (Manifest) für die Anwendung fungiert.

## Ausführung
Das Skript ist in den Build-Prozess eingebunden und wird bei jedem Deployment (`npm run build`) automatisch ausgeführt. 
Um es manuell auszuführen, nutze folgenden Befehl im Hauptverzeichnis des Projekts:

```bash
npm run fetch-items
```

## Fehlerbehandlung
Sollten einzelne Items im Wiki kein direktes `pageimage` hinterlegt haben (z.B. spezielle Varianten wie bestimmte Glasscheiben), gibt das Skript eine Warnung (`[WARN]`) in der Konsole aus. Diese fehlenden Bilder können bei Bedarf manuell in `public/items/` ergänzt werden oder das Skript greift sie im nächsten Lauf auf, falls das Wiki aktualisiert wurde.
