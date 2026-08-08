# MC SurvivalProjekt Wiki

This is the official full-stack wiki application for our Minecraft server, offering detailed information about commands, worlds, items, crafting recipes, bosses, tasks, and shop offers.

## Tech Stack

The application is built with modern, high-performance technologies:

- **Framework**: [TanStack Start](https://tanstack.com/start) (React SSR + Server Functions)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Database**: PostgreSQL (via Docker)
- **Styling**: Tailwind CSS & Radix UI

## Getting Started Locally

### Prerequisites

- Node.js (v20+)
- Docker Desktop (for the local PostgreSQL database)

### Setup & Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start the Database**
   Launch Docker Desktop, then run the database container:

   ```bash
   docker compose up db -d
   ```

   _(Wait a few seconds for Postgres to initialize)._

3. **Configure Environment Variables**
   Make sure your `.env` file matches the database configuration from docker-compose:

   ```env
   DATABASE_URL="postgresql://wiki_user:wiki_password@localhost:5432/mc_wiki?schema=public"
   ```

4. **Apply Database Schema**
   Push the Prisma schema to the database:

   ```bash
   npx prisma db push
   ```

5. **Run the Development Server**
   Start the TanStack Start development server:
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:5173`.

## Production Deployment & CI/CD

The application utilizes **GitHub Actions** and the **GitHub Container Registry (GHCR)** for automated pre-compilation.

### 1. Automated Pre-Build via GitHub Actions
On every push to `main`, GitHub Actions compiles the app, builds the Docker image, and publishes it to `ghcr.io/orfelorfel23/mc-survivalprojekt-wiki:latest`.

### 2. Fast Server Deployment (Jannik Cloud)
To deploy the latest pre-compiled image on the server without rebuilding locally:

```bash
docker compose pull && docker compose up -d
```

### 3. Local Docker Build (Alternative)
To build and run the entire application locally via Docker:

```bash
docker compose up -d --build
```

## Architecture & Roles

The application features a robust permission system using Better Auth and Prisma:

- **Admins**: Can manage user roles via the `/admin` dashboard.
- **Editors**: Can create and edit wiki pages, items, recipes, etc.
- **Users**: Can browse the wiki and search for information globally.

_(Note: The global search function searches across multiple tables natively using Prisma `$queryRaw`.)_
