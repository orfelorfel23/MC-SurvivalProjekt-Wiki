<p align="center">
  <img src="icon_small.png" alt="MC-SurvivalProjekt-Wiki Logo" width="128" />
</p>

<h1 align="center">MC-SurvivalProjekt-Wiki</h1>
<p align="center"><strong>Full-stack Minecraft server wiki built with TanStack Start, Prisma, Better Auth, and PostgreSQL.</strong></p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> · <a href="LIESMICH.md">🇩🇪 Deutsch</a>
</p>

---

## Overview

**MC-SurvivalProjekt-Wiki** is the official full-stack wiki application for a Minecraft survival server. It provides bilingual (German/English) documentation for commands, worlds, custom items, crafting recipes, bosses, tasks, shop offers, pets/mounts, custom wiki pages, and an interactive Leaflet world map with Points of Interest (`WikiPoi`).

```text
Browser ──► Express 5 Entry (server-entry.ts :3000)
               ├── /api/auth/* ──► Better Auth ──► PostgreSQL (Prisma)
               ├── SSR / Server Functions ──► TanStack Start ──► PostgreSQL
               └── Static Assets (dist/client, public/items/)
```

---

## Features

- **Comprehensive Wiki Categories (`/$kind` & `/$kind/$slug`)**: Commands (`befehle`), Worlds (`welten`), Custom Items (`items`), Crafting Recipes (`rezepte`), Bosses (`bosse`), Daily/Periodic Tasks (`aufgaben`), Shop Offers (`shop`), Pets & Mounts (`pets`), and Markdown Wiki Pages (`wiki`).
- **Dynamic Custom Tabs & Modules (`/editor/tabs`)**: Configurable `WikiTab` entries with ordered modules and visibility toggles.
- **Interactive World Map (`/map` & `/karte`)**: Built with Leaflet / React-Leaflet displaying world POIs (`WikiPoi`) with coordinates (`x`, `y`, `z`), icons, and images.
- **Bilingual Content & UI (`DE` / `EN`)**: Built-in language switcher (`src/lib/i18n.ts`) with localized database fields (`*De` / `*En`) and automatic fallback.
- **Global & Advanced Search (`/search`)**: Searches across multiple database tables natively using Prisma `$queryRaw` plus category/rarity filters.
- **Role-Based Access Control (Better Auth + Prisma)**:
  - **Admins**: Manage user roles (`ADMIN`, `MODERATOR`, `EDITOR`) via `/admin`, inspect broken links (`/admin/broken-links`), and manage soft-deleted items in `/admin/trash`.
  - **Editors**: Create and edit wiki entries, recipes (`/editor/recipes/$id`), and tabs (`/editor/tabs/$id`) with Markdown preview (`@uiw/react-md-editor`) and soft-delete support (`deletedAt`).
  - **Users**: Browse content, track recently viewed entries, comment on recipes, view server status (`ServerStatus`), and inspect player skins (`SkinViewer`).
- **Minecraft Item Icon Fetcher (`npm run fetch-items`)**: Downloads Minecraft 1.20 item/block textures in three passes (Official Minecraft Wiki `pageimages`, direct `imageinfo` filename guesses, and `misode/mcmeta` fallback) into `public/items/` and writes `public/mc-items.json`.
- **Automated Docker & GHCR CI/CD**: GitHub Actions automatically builds and publishes the production container image to `ghcr.io/orfelorfel23/mc-survivalprojekt-wiki:latest` on pushes to `main`.

---

## How It Works & Tech Stack

### Architecture & Runtime

- **SSR & Routing**: TanStack Start uses file-based routing under `src/routes/`. In production, `server-entry.ts` is bundled with `esbuild` into `server.js`, serving static assets from `dist/client`, routing `/api/auth/*` directly to Better Auth, and forwarding all remaining requests to TanStack Start's SSR `handler.fetch`.
- **Database Schema (`prisma/schema.prisma`)**: Combines Better Auth tables (`user`, `session`, `account`, `verification`) with application models (`user_roles`, `profiles`, `worlds`, `commands`, `items`, `recipes`, `bosses`, `tasks`, `shop_offers`, `pets`, `wiki_pages`, `wiki_tabs`, `comments`, `wiki_pois`).
- **Automated Backups (`docker-compose.yml`)**: Runs `prodrigestivill/postgres-backup-local` on a `@daily` schedule alongside PostgreSQL 15.

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework & Routing** | TanStack Start, TanStack Router, TanStack React Query, React 19, TypeScript |
| **Server Runtime** | Node.js (v20+ local / `node:22-alpine` in Docker), Express 5 (`server-entry.ts`) |
| **Database & ORM** | PostgreSQL 15, Prisma 6 (`@prisma/client`) |
| **Authentication** | Better Auth (`better-auth` with `prismaAdapter`, email & password) |
| **UI & Rich Features** | Tailwind CSS v4, Radix UI, Lucide React, Leaflet / React-Leaflet, `@uiw/react-md-editor`, `react-markdown`, `rehype-sanitize`, `remark-gfm`, Recharts, Fuse.js |
| **Testing & Tooling** | Playwright (`@playwright/test`), ESLint, Prettier, `tsx`, `esbuild` |

### Ports

| Service | Container / Dev Port | Host Mapping (`docker-compose.yml`) |
|---------|----------------------|-------------------------------------|
| **Web App (Production)** | `3000` | `3000:3000` |
| **Vite Dev Server** | `5173` | — |
| **PostgreSQL** | `5432` | `25560:5432` |

---

## Prerequisites & Installation

### Prerequisites

- **Node.js** ≥ 20
- **Docker** & **Docker Compose** (for local PostgreSQL or production containers)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/orfelorfel23/MC-SurvivalProjekt-Wiki.git
   cd MC-SurvivalProjekt-Wiki
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start PostgreSQL via Docker**:
   ```bash
   docker compose up db -d
   ```
   *(Wait a few seconds for PostgreSQL to become healthy.)*

4. **Configure `.env`**:
   Copy `.env.example` to `.env` and ensure `DATABASE_URL` matches `docker-compose.yml` (adjust port `25560` vs `5432` depending on whether you connect to the Dockerized DB):
   ```env
   DATABASE_URL="postgresql://wiki_user:wiki_password@localhost:25560/mc_wiki?schema=public"
   BETTER_AUTH_SECRET="super-secret-key-for-development"
   BETTER_AUTH_URL="http://localhost:5173"
   ```

5. **Push the Prisma schema**:
   ```bash
   npx prisma db push
   ```

6. **(Optional) Download Minecraft item icons**:
   ```bash
   npm run fetch-items
   ```

7. **Run the development server**:
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:5173`.

### Production Deployment & CI/CD

#### 1. Automated Pre-Build via GitHub Actions

`.github/workflows/docker-publish.yml` runs on every push to `main` (ignoring `**.md` and `.vscode/**`) and via `workflow_dispatch`. It compiles the multi-stage `Dockerfile` and publishes the image to:
- `ghcr.io/orfelorfel23/mc-survivalprojekt-wiki:latest`
- Short commit SHA and branch ref tags

On container startup, `Dockerfile` executes:
```sh
npx prisma db push && node server.js
```

#### 2. Fast Server Deployment (Pre-Compiled GHCR Image)

```bash
docker compose pull
docker compose up -d
```

#### 3. Local Docker Build (Alternative)

```bash
docker compose up -d --build
```

---

## Configuration

### Environment Variables (`.env` / `docker-compose.yml`)

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| `DATABASE_URL` | PostgreSQL connection URL used by Prisma & Better Auth | `postgresql://wiki_user:wiki_password@db:5432/mc_wiki?schema=public` |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth to sign sessions/tokens | `super-secret-key-for-development` |
| `BETTER_AUTH_URL` | Public base URL of the application | `http://localhost:3000` (`.env.example`) / `https://mc-survival-wiki.orfel.de` (`docker-compose.yml`) |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Comma-separated list of trusted origins for Better Auth | `http://localhost:3000,https://mc-survival-wiki.orfel.de` |
| `PORT` | HTTP listen port for `server.js` | `3000` |
| `HOST` | Bind host for `server.js` | `0.0.0.0` |

### Persistent Volumes (`docker-compose.yml`)

- `/mnt/Jannik-Cloud-Volume-01/mc-survival-wiki/db-data:/var/lib/postgresql/data` – PostgreSQL database files
- `/mnt/Jannik-Cloud-Volume-01/mc-survival-wiki/backups:/backups` – Automated daily PostgreSQL backups (`7` days, `4` weeks, `6` months retention)

---

## Usage

### Available npm Scripts (`package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite dev` | Start local TanStack Start dev server (`:5173`) |
| `npm run fetch-items` | `npx tsx scripts/fetch-mc-items.ts` | Download Minecraft item icons into `public/items/` and create `public/mc-items.json` |
| `npm run build` | `vite build && esbuild server-entry.ts ...` | Build client/SSR bundles and production `server.js` |
| `npm run build:dev` | `npm run fetch-items && vite build --mode development` | Fetch item icons and run development build |
| `npm run preview` | `vite preview` | Preview Vite build |
| `npm run lint` | `eslint .` | Run ESLint |
| `npm run format` | `prettier --write .` | Format codebase with Prettier |
| `npm run test:e2e` | `playwright test` | Run Playwright E2E tests (`tests/auth.spec.ts`, `tests/public-pages.spec.ts`, `tests/search.spec.ts`) |
| `npm run test:e2e:ui` | `playwright test --ui` | Open Playwright UI runner |

### Key Application Routes

- `/` – Home page with live `ServerStatus`, `SkinViewer`, and quick category links
- `/$kind` & `/$kind/$slug` – Category listings and detail pages (`befehle`, `welten`, `items`, `rezepte`, `bosse`, `aufgaben`, `shop`, `pets`, `wiki`)
- `/search` – Global and filtered search across wiki content
- `/map` & `/karte` – Interactive world map with POIs
- `/login` – Better Auth sign-in / registration
- `/editor`, `/editor/recipes/$id`, `/editor/tabs/$id` – Content editor for `EDITOR` / `ADMIN` roles
- `/admin`, `/admin/broken-links`, `/admin/trash` – Role management, broken-link check, and trash recovery for `ADMIN` users

---

## Project Structure

```text
MC-SurvivalProjekt-Wiki/
├── .github/workflows/
│   └── docker-publish.yml       # Builds & pushes Docker image to GHCR
├── prisma/
│   └── schema.prisma            # Better Auth & Wiki PostgreSQL models
├── public/
│   ├── items/                   # Downloaded Minecraft item icons
│   └── mc-items.json            # Generated item icon manifest
├── scripts/
│   └── fetch-mc-items.ts        # 3-pass Minecraft item texture downloader
├── src/
│   ├── components/              # UI components (server-status, skin-viewer, wiki-map, etc.)
│   ├── lib/
│   │   ├── auth.ts              # Better Auth configuration (Prisma adapter)
│   │   ├── auth-client.ts       # Client auth hooks
│   │   └── i18n.ts              # DE/EN localization strings & kind mappings
│   ├── routes/                  # TanStack Start file-based routes
│   └── server/
│       ├── db.ts                # Prisma client instance
│       └── functions.ts         # Server functions (search, CRUD, roles)
├── tests/                       # Playwright E2E specs (auth, public-pages, search)
├── .env.example                 # Environment variable template
├── docker-compose.yml           # PostgreSQL 15, Web app (GHCR), & daily DB backup
├── Dockerfile                   # Multi-stage Node 22 Alpine production image
├── icon_small.png               # Wiki logo
├── package.json                 # Dependencies & scripts
└── server-entry.ts              # Express 5 + Better Auth + TanStack Start SSR entrypoint
```

---

## License

This project's own code is dedicated to the public domain under **CC0 1.0 Universal** — see [`LICENSE`](LICENSE).

> **Third-Party Components:** External dependencies, bundled libraries, fonts, datasets, and media assets retain their own respective licenses and are excluded from CC0 1.0. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for details.
