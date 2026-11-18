<p align="center">
  <img src="icon_small.png" alt="MC-SurvivalProjekt-Wiki Logo" width="128" />
</p>

<h1 align="center">MC-SurvivalProjekt-Wiki</h1>
<p align="center"><strong>Full-Stack-Minecraft-Server-Wiki auf Basis von TanStack Start, Prisma, Better Auth und PostgreSQL.</strong></p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> · <a href="LIESMICH.md">🇩🇪 Deutsch</a>
</p>

---

## Überblick

**MC-SurvivalProjekt-Wiki** ist die offizielle Full-Stack-Wiki-Anwendung für einen Minecraft-Survival-Server. Sie bietet zweisprachige (Deutsch/Englisch) Informationen zu Befehlen, Welten, Custom-Items, Crafting-Rezepten, Bossen, Aufgaben, Shop-Angeboten, Begleitern/Reittieren, eigenen Wiki-Seiten sowie eine interaktive Leaflet-Weltkarte mit Points of Interest (`WikiPoi`).

```text
Browser ──► Express-5-Entrypoint (server-entry.ts :3000)
               ├── /api/auth/* ──► Better Auth ──► PostgreSQL (Prisma)
               ├── SSR / Server Functions ──► TanStack Start ──► PostgreSQL
               └── Statische Assets (dist/client, public/items/)
```

---

## Funktionen

- **Umfassende Wiki-Kategorien (`/$kind` & `/$kind/$slug`)**: Befehle (`befehle`), Welten (`welten`), Gegenstände (`items`), Crafting-Rezepte (`rezepte`), Bosse (`bosse`), Aufgaben (`aufgaben`), Shop-Angebote (`shop`), Begleiter & Reittiere (`pets`) und Markdown-Wiki-Seiten (`wiki`).
- **Dynamische Tabs & Module (`/editor/tabs`)**: Konfigurierbare `WikiTab`-Reiter mit sortierbaren Modulen und Sichtbarkeitsschalter.
- **Interaktive Weltkarte (`/map` & `/karte`)**: Leaflet-/React-Leaflet-Karte zur Anzeige von Welt-POIs (`WikiPoi`) mit Koordinaten (`x`, `y`, `z`), Icons und Bildern.
- **Zweisprachige Oberfläche & Inhalte (`DE` / `EN`)**: Integrierter Sprachwechsler (`src/lib/i18n.ts`) mit lokalisierten Datenbankfeldern (`*De` / `*En`) und automatischem Fallback.
- **Globale & erweiterte Suche (`/search`)**: Durchsucht mehrere Datenbanktabellen nativ per Prisma `$queryRaw` sowie über Kategorie- und Seltenheitsfilter.
- **Rollenbasierte Zugriffskontrolle (Better Auth + Prisma)**:
  - **Admins**: Verwalten Benutzerrollen (`ADMIN`, `MODERATOR`, `EDITOR`) unter `/admin`, prüfen defekte Links (`/admin/broken-links`) und stellen gelöschte Einträge im Papierkorb (`/admin/trash`) wieder her.
  - **Editoren**: Erstellen und bearbeiten Wiki-Einträge, Rezepte (`/editor/recipes/$id`) und Tabs (`/editor/tabs/$id`) inklusive Markdown-Editor (`@uiw/react-md-editor`) und Soft-Delete (`deletedAt`).
  - **Benutzer**: Durchsuchen das Wiki, nutzen den Verlauf zuletzt angesehener Seiten, kommentieren Rezepte und sehen Serverstatus (`ServerStatus`) sowie Spieler-Skins (`SkinViewer`).
- **Minecraft-Item-Icon-Downloader (`npm run fetch-items`)**: Lädt Minecraft-1.20-Item- und Block-Texturen in drei Durchläufen (Offizielles Minecraft Wiki `pageimages`, direkte `imageinfo`-Dateinamen-Vermutungen und `misode/mcmeta`-Fallback) nach `public/items/` und erzeugt `public/mc-items.json`.
- **Automatisiertes Docker- & GHCR-CI/CD**: GitHub Actions baut und veröffentlicht das Produktions-Image bei jedem Push auf `main` automatisch unter `ghcr.io/orfelorfel23/mc-survivalprojekt-wiki:latest`.

---

## Funktionsweise & Tech-Stack

### Architektur & Laufzeit

- **SSR & Routing**: TanStack Start nutzt dateibasiertes Routing unter `src/routes/`. In der Produktion wird `server-entry.ts` mittels `esbuild` zu `server.js` gebündelt, liefert statische Dateien aus `dist/client` aus, leitet `/api/auth/*` direkt an Better Auth und alle weiteren Anfragen an den SSR-Handler (`handler.fetch`) von TanStack Start.
- **Datenbankschema (`prisma/schema.prisma`)**: Verbindet Better-Auth-Modelle (`user`, `session`, `account`, `verification`) mit den Anwendungsmodellen (`user_roles`, `profiles`, `worlds`, `commands`, `items`, `recipes`, `bosses`, `tasks`, `shop_offers`, `pets`, `wiki_pages`, `wiki_tabs`, `comments`, `wiki_pois`).
- **Automatische Backups (`docker-compose.yml`)**: `prodrigestivill/postgres-backup-local` sichert die PostgreSQL-15-Datenbank täglich (`@daily`).

### Tech-Stack

| Schicht | Technologien |
|---------|-------------|
| **Framework & Routing** | TanStack Start, TanStack Router, TanStack React Query, React 19, TypeScript |
| **Server-Laufzeit** | Node.js (v20+ lokal / `node:22-alpine` in Docker), Express 5 (`server-entry.ts`) |
| **Datenbank & ORM** | PostgreSQL 15, Prisma 6 (`@prisma/client`) |
| **Authentifizierung** | Better Auth (`better-auth` mit `prismaAdapter`, E-Mail & Passwort) |
| **UI & Zusatzfunktionen** | Tailwind CSS v4, Radix UI, Lucide React, Leaflet / React-Leaflet, `@uiw/react-md-editor`, `react-markdown`, `rehype-sanitize`, `remark-gfm`, Recharts, Fuse.js |
| **Tests & Tooling** | Playwright (`@playwright/test`), ESLint, Prettier, `tsx`, `esbuild` |

### Ports

| Dienst | Container-/Dev-Port | Host-Mapping (`docker-compose.yml`) |
|--------|---------------------|-------------------------------------|
| **Web-App (Produktion)** | `3000` | `3000:3000` |
| **Vite Dev-Server** | `5173` | — |
| **PostgreSQL** | `5432` | `25560:5432` |

---

## Voraussetzungen & Installation

### Voraussetzungen

- **Node.js** ≥ 20
- **Docker** & **Docker Compose** (für lokale PostgreSQL-Datenbank oder Produktions-Container)

### Lokale Entwicklungsumgebung

1. **Repository klonen**:
   ```bash
   git clone https://github.com/orfelorfel23/MC-SurvivalProjekt-Wiki.git
   cd MC-SurvivalProjekt-Wiki
   ```

2. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

3. **PostgreSQL per Docker starten**:
   ```bash
   docker compose up db -d
   ```
   *(Einige Sekunden warten, bis PostgreSQL bereit ist.)*

4. **`.env` konfigurieren**:
   `.env.example` nach `.env` kopieren und `DATABASE_URL` passend zur `docker-compose.yml` setzen (Port `25560` beim Zugriff vom Host auf den Docker-Container, bzw. `5432` bei lokaler Postgres-Instanz):
   ```env
   DATABASE_URL="postgresql://wiki_user:wiki_password@localhost:25560/mc_wiki?schema=public"
   BETTER_AUTH_SECRET="super-secret-key-for-development"
   BETTER_AUTH_URL="http://localhost:5173"
   ```

5. **Prisma-Schema anwenden**:
   ```bash
   npx prisma db push
   ```

6. **(Optional) Minecraft-Item-Icons herunterladen**:
   ```bash
   npm run fetch-items
   ```

7. **Entwicklungsserver starten**:
   ```bash
   npm run dev
   ```
   Die Anwendung ist anschließend unter `http://localhost:5173` erreichbar.

### Produktions-Deployment & CI/CD

#### 1. Automatisierter Pre-Build über GitHub Actions

`.github/workflows/docker-publish.yml` startet bei jedem Push auf `main` (außer `**.md` und `.vscode/**`) sowie per `workflow_dispatch`. Das Multi-Stage-`Dockerfile` wird gebaut und unter `ghcr.io/orfelorfel23/mc-survivalprojekt-wiki:latest` (plus Short-SHA- und Branch-Tag) veröffentlicht.

Beim Container-Start führt das `Dockerfile` automatisch Folgendes aus:
```sh
npx prisma db push && node server.js
```

#### 2. Schnelles Server-Deployment (vorgebautes GHCR-Image)

```bash
docker compose pull
docker compose up -d
```

#### 3. Lokaler Docker-Build (Alternative)

```bash
docker compose up -d --build
```

---

## Konfiguration

### Umgebungsvariablen (`.env` / `docker-compose.yml`)

| Variable | Beschreibung | Beispiel / Standard |
|----------|-------------|---------------------|
| `DATABASE_URL` | PostgreSQL-Verbindungs-URL für Prisma & Better Auth | `postgresql://wiki_user:wiki_password@db:5432/mc_wiki?schema=public` |
| `BETTER_AUTH_SECRET` | Geheimer Schlüssel zum Signieren von Sessions/Tokens | `super-secret-key-for-development` |
| `BETTER_AUTH_URL` | Öffentliche Basis-URL der Anwendung | `http://localhost:3000` (`.env.example`) / `https://mc-survival-wiki.orfel.de` (`docker-compose.yml`) |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Kommagetrennte Liste vertrauenswürdiger Origins | `http://localhost:3000,https://mc-survival-wiki.orfel.de` |
| `PORT` | HTTP-Listen-Port für `server.js` | `3000` |
| `HOST` | Bind-Adresse für `server.js` | `0.0.0.0` |

### Persistente Volumes (`docker-compose.yml`)

- `/mnt/Jannik-Cloud-Volume-01/mc-survival-wiki/db-data:/var/lib/postgresql/data` – PostgreSQL-Datenbankdateien
- `/mnt/Jannik-Cloud-Volume-01/mc-survival-wiki/backups:/backups` – Tägliche PostgreSQL-Backups (`7` Tage, `4` Wochen, `6` Monate Aufbewahrung)

---

## Nutzung

### Verfügbare npm-Skripte (`package.json`)

| Skript | Befehl | Zweck |
|--------|--------|-------|
| `npm run dev` | `vite dev` | Startet den lokalen TanStack-Start-Entwicklungsserver (`:5173`) |
| `npm run fetch-items` | `npx tsx scripts/fetch-mc-items.ts` | Lädt Minecraft-Item-Icons nach `public/items/` und erzeugt `public/mc-items.json` |
| `npm run build` | `vite build && esbuild server-entry.ts ...` | Baut Client-/SSR-Bundles sowie die Produktionsdatei `server.js` |
| `npm run build:dev` | `npm run fetch-items && vite build --mode development` | Lädt Item-Icons und startet einen Development-Build |
| `npm run preview` | `vite preview` | Vorschau des Vite-Builds |
| `npm run lint` | `eslint .` | Führt ESLint aus |
| `npm run format` | `prettier --write .` | Formatiert den Code mit Prettier |
| `npm run test:e2e` | `playwright test` | Führt Playwright-E2E-Tests aus (`tests/auth.spec.ts`, `tests/public-pages.spec.ts`, `tests/search.spec.ts`) |
| `npm run test:e2e:ui` | `playwright test --ui` | Öffnet den interaktiven Playwright-Test-Runner |

### Wichtige Anwendungsrouten

- `/` – Startseite mit Live-`ServerStatus`, `SkinViewer` und Kategorie-Schnellzugriff
- `/$kind` & `/$kind/$slug` – Kategorie-Übersichten und Detailseiten (`befehle`, `welten`, `items`, `rezepte`, `bosse`, `aufgaben`, `shop`, `pets`, `wiki`)
- `/search` – Globale und gefilterte Suche über alle Wiki-Inhalte
- `/map` & `/karte` – Interaktive Weltkarte mit POIs
- `/login` – Better-Auth-Anmeldung und Registrierung
- `/editor`, `/editor/recipes/$id`, `/editor/tabs/$id` – Inhalts-Editor für `EDITOR`- und `ADMIN`-Rollen
- `/admin`, `/admin/broken-links`, `/admin/trash` – Rollenverwaltung, Broken-Link-Prüfung und Papierkorb für `ADMIN`-Benutzer

---

## Projektstruktur

```text
MC-SurvivalProjekt-Wiki/
├── .github/workflows/
│   └── docker-publish.yml       # Baut und pusht das Docker-Image nach GHCR
├── prisma/
│   └── schema.prisma            # Better-Auth- und Wiki-PostgreSQL-Modelle
├── public/
│   ├── items/                   # Heruntergeladene Minecraft-Item-Icons
│   └── mc-items.json            # Generiertes Item-Icon-Manifest
├── scripts/
│   └── fetch-mc-items.ts        # 3-stufiger Minecraft-Item-Textur-Downloader
├── src/
│   ├── components/              # UI-Komponenten (server-status, skin-viewer, wiki-map usw.)
│   ├── lib/
│   │   ├── auth.ts              # Better-Auth-Konfiguration (Prisma-Adapter)
│   │   ├── auth-client.ts       # Client-Auth-Hooks
│   │   └── i18n.ts              # DE/EN-Übersetzungen & Kategorie-Mappings
│   ├── routes/                  # Dateibasierte TanStack-Start-Routen
│   └── server/
│       ├── db.ts                # Prisma-Client-Instanz
│       └── functions.ts         # Server Functions (Suche, CRUD, Rollen)
├── tests/                       # Playwright-E2E-Tests (auth, public-pages, search)
├── .env.example                 # Vorlage für Umgebungsvariablen
├── docker-compose.yml           # PostgreSQL 15, Web-App (GHCR) & tägliches DB-Backup
├── Dockerfile                   # Multi-Stage-Node-22-Alpine-Produktions-Image
├── icon_small.png               # Wiki-Logo
├── package.json                 # Abhängigkeiten & Skripte
└── server-entry.ts              # Express-5- + Better-Auth- + TanStack-Start-SSR-Entrypoint
```

---

## Lizenz

Der eigene Quellcode dieses Projekts steht unter **CC0 1.0 Universal** (Public Domain) — Details in [`LICENSE`](LICENSE).

> **Drittanbieter-Bestandteile:** Externe Abhängigkeiten, eingebundene Bibliotheken, Schriften, Datensätze und Medien-Assets unterliegen weiterhin ihren jeweiligen eigenen Lizenzen und sind von CC0 1.0 ausgenommen. Details siehe [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
