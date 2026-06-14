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

## Production Deployment (Complete Package)

To build and run the entire application (Web Server + Database) as a complete package via Docker:

```bash
docker compose up -d --build
```

This will automatically build the application image and start both containers. The web app will be mapped to port `3000`.

## Architecture & Roles

The application features a robust permission system using Better Auth and Prisma:

- **Admins**: Can manage user roles via the `/admin` dashboard.
- **Editors**: Can create and edit wiki pages, items, recipes, etc.
- **Users**: Can browse the wiki and search for information globally.

_(Note: The global search function searches across multiple tables natively using Prisma `$queryRaw`.)_
