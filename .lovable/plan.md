## Ziel

Ein öffentlich lesbares Wiki für deinen Minecraft-Server, in dem nur autorisierte Nutzer (du + zugewiesene Editoren) Inhalte bearbeiten dürfen. Spieler können alles ohne Login lesen, filtern und durchsuchen. Inhalte werden in einer PostgreSQL-Datenbank gespeichert, sodass du das Wiki später auch selbst hosten und an eine eigene Datenbank anschließen kannst.

## Datenbank-Strategie (wichtig vorab)

- Für die Entwicklung in Lovable nutzen wir **Lovable Cloud** (basiert auf PostgreSQL + Auth). Das ist die schnellste Variante und liefert sofort Auth, Storage für Bilder und eine Postgres-DB.
- Da Lovable Cloud unter der Haube eine echte **PostgreSQL**-Datenbank ist, kannst du beim Self-Hosting später entweder:
  1. Die offene Self-Hosting-Variante (Supabase) auf deinem Server installieren und den vorhandenen Schema-Dump importieren, oder
  2. Eine **eigene PostgreSQL-DB** anschließen und nur den Datenbank-Layer austauschen (Auth + Storage müssten dann ersetzt werden, z. B. durch eine eigene Auth-Lösung).
- Alle Schemas werden als versionierte SQL-Migrations geliefert, sodass du sie 1:1 in deine eigene Postgres-Instanz spielen kannst.

## Rollen & Auth

- **Gäste (nicht eingeloggt):** Lesen, Suchen, Filtern.
- **Editor:** Anlegen / Bearbeiten / Löschen von Wiki-Inhalten.
- **Admin (du):** Editor-Rolle + Benutzerverwaltung (Editoren ernennen/entziehen).
- Login per E-Mail/Passwort. Rollen liegen in einer separaten `user_roles`-Tabelle (Security-Best-Practice, kein Privilege-Escalation-Risiko).

## Inhaltsmodell

Folgende Inhaltstypen bekommen jeweils eine eigene Tabelle, Listen-/Filterseite und Detailseite:

- **Befehle** (Name, Syntax, Beschreibung, Permission, Beispiele, Kategorie)
- **Welten** (Name, Typ: Bosswelt/Farmwelt/Bauwelt/…, Beschreibung, Regeln, Zugang)
- **Items** (Name, Oraxen-ID, Beschreibung, Seltenheit, Bild, Bezugsquelle, Tags, enchanted ja/nein)
- **Craftingrezepte** (Ergebnis-Item, 3×3-Grid mit Item-Referenzen pro Slot, geformt/ungeformt, benötigte Station)
- **Bosse** (Name, Welt, benötigtes Spawn-Item, Drops, Schwierigkeit, Strategie, Bild)
- **Tägliche Aufgaben** (Name, Beschreibung, Belohnung, Kategorie, Wiederholbarkeit)
- **Shop-Angebote am Spawn** (Item, Preis in Ingame-Währung, Kategorie)
- **Mounts / Pets** (Name, Quelle z. B. SamusDev RPG Pets, Skills, Bezugsquelle, Bild)
- **Generische Wiki-Seiten** (frei strukturierter Markdown-Inhalt für „weitere Dinge“: Plugins, Regeln, FAQ, Server-Etikette)

Alle Inhalte unterstützen:
- Slug für saubere URLs (`/items/feuerklinge`)
- `name_de` / `name_en` + `body_de` / `body_en` (Englisch optional, fällt auf Deutsch zurück, wenn leer)
- Bild-Upload (Storage-Bucket „wiki-media“) – Bilder werden **nicht** übersetzt
- Tags / Kategorien für Filter
- Letzte Änderung + Autor

## Crafting-Grid

- 3×3-Grid-Komponente mit Slot-Bildern aus den Item-Bildern (Hover zeigt Item-Name + Link zur Item-Detailseite).
- **Enchantment-Glint:** CSS-Overlay (animierter Verlauf mit `mix-blend-mode`) auf Item-Slots, deren referenziertes Item `enchanted=true` ist. Funktioniert ohne externe Libraries, performant, sieht aus wie der Vanilla-Glint.
- Unterscheidung zwischen geformten (Position relevant) und ungeformten (Position egal) Rezepten.
- Anzeige der benötigten Crafting-Station (z. B. Workbench, Smithing Table) falls relevant.
- Reverse-Lookup: auf einer Item-Detailseite werden automatisch alle Rezepte angezeigt, in denen das Item Zutat oder Ergebnis ist.

## Suche & Filter

- **Globale Suche** in der Top-Bar: durchsucht Name + Beschreibung über alle Inhaltstypen, Ergebnisse gruppiert nach Typ (Items, Bosse, Befehle …).
- **Pro Listenseite:** Filter nach Kategorie / Welt / Seltenheit / Tag sowie Sortierung. Filterzustand liegt in URL-Search-Params, also bookmarkbar.
- Volltextsuche via Postgres `tsvector` für gute Performance, auch bei vielen Einträgen.

## Sprachen (DE / EN)

- Sprachschalter in der Top-Bar (DE/EN).
- DE ist Default. EN-Felder sind optional; fehlt EN, wird DE angezeigt.
- UI-Strings via leichtgewichtigem i18n-Modul (`src/lib/i18n.ts`, simple Key-Map, kein i18next).
- Bilder sind sprachneutral und werden 1:1 angezeigt.

## Editor-Erfahrung (eingeloggt)

- „Bearbeiten“-Button auf jeder Detailseite (nur für Editoren sichtbar).
- Formulare mit Live-Vorschau für Markdown-Felder.
- Crafting-Rezept-Editor: 3×3-Grid, pro Slot ein Item-Picker (Suche nach Item-Name).
- Bild-Upload per Drag & Drop in den `wiki-media`-Bucket.
- `/admin` zeigt Benutzerverwaltung (nur Admin) und Übersicht aller Inhalte.

## Style

Modern aber Minecraft-like:
- Dunkles Theme als Default, optionaler heller Modus.
- Dezente Pixel-Akzente (z. B. Borders, Hover-Effekte) statt durchgehender Pixel-Optik, damit Lesbarkeit erhalten bleibt.
- Klare Typografie (sans-serif) für Fließtext, Pixel-Display-Font nur für Headlines und Item-Namen.
- Item-Cards im Minecraft-Inventar-Look (Slot-Rahmen, leichte Innenschatten), aber moderne Spacing-/Grid-Strukturen drumherum.

## Routen-Übersicht

```text
/                          Startseite (Hero, Quick-Links, neueste Änderungen)
/search                    Globale Suchergebnisse
/auth                      Login
/befehle, /befehle/$slug
/welten,  /welten/$slug
/items,   /items/$slug
/rezepte, /rezepte/$slug
/bosse,   /bosse/$slug
/aufgaben,/aufgaben/$slug
/shop,    /shop/$slug
/pets,    /pets/$slug
/wiki,    /wiki/$slug      Generische Wiki-Seiten
/admin                     Nur Admin: Benutzer & Rollen
```

## Umsetzungsschritte

1. Lovable Cloud aktivieren (Postgres + Auth + Storage).
2. Migrations anlegen: `profiles`, `app_role` enum + `user_roles` + `has_role()`-Funktion, alle Inhaltstabellen mit RLS-Policies (Public Read, Editor Write).
3. Storage-Bucket `wiki-media` (öffentlich lesbar, Upload nur Editoren).
4. Auth-Setup (`/auth`, geschützte `/admin`-Route).
5. Layout, Navigation, Sprachschalter, dunkles Theme + Design-Tokens.
6. Listen- und Detailseiten pro Inhaltstyp + Editor-Formulare.
7. Crafting-Grid-Komponente inkl. Glint-Effekt + Reverse-Lookup.
8. Globale Suche (Postgres-Volltext) + URL-basierte Filter.
9. Admin-Bereich für Benutzer-/Rollenverwaltung.
10. Seed-Daten als Beispiele (ein Item, ein Rezept, ein Boss, eine Aufgabe), damit du sofort siehst, wie das Pflegen aussieht.

## Technisches (für später / Self-Hosting)

- Stack: TanStack Start (React 19, Vite), TailwindCSS, Lovable Cloud (Postgres + Auth + Storage).
- Datenbank: Standard-PostgreSQL-Schema, alle Änderungen als Migrations unter `supabase/migrations/`.
- Self-Hosting-Pfad: Migrations in eigene Postgres-Instanz importieren; Auth & Storage entweder via Self-Hosted Supabase oder durch eigene Implementierungen ersetzen. Der Frontend-Code abstrahiert Datenzugriffe in `src/lib/api/*`, sodass ein DB-Wechsel an einer zentralen Stelle erfolgt.
- Bilder werden im Storage abgelegt und per CDN-URL ausgeliefert; im Self-Hosting kann der Bucket auf ein S3-kompatibles Backend zeigen.

Sag mir, ob ich so loslegen darf, oder ob du noch etwas am Inhaltsmodell oder Style anpassen möchtest.