# KasFlow

KasFlow is a monorepo cashflow web app (React + Hono/tRPC) for tracking income and expenses with typed APIs and SQLite.

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Authentication** - Better-Auth
- **Biome** - Linting and formatting

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Environment Variables

Copy the example env file and fill in your values before running the dev server:

```bash
cp apps/server/.env.example apps/server/.env
```

Key variables in `apps/server/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite file path (e.g. `file:./local.db`) or Turso connection string |
| `BETTER_AUTH_SECRET` | Random secret for session signing — generate with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | Base URL your auth callbacks resolve to (e.g. `http://localhost:3000`) |

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database (optional):

```bash
bun run db:local
```

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@KasFlow/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Format and lint fix: `bun run check`

## Project Structure

```
KasFlow/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run db:local`: Start the local SQLite database
- `bun run check`: Run Biome formatting and linting

## Deployment

Build both apps before deploying:

```bash
bun run build
```

**Server** — the Hono API compiles to a single Node-compatible bundle in `apps/server/dist`. Run it with:

```bash
node apps/server/dist/index.js
```

Set `NODE_ENV=production` and ensure all environment variables from `apps/server/.env.example` are set in your production environment before starting.

**Web** — the React frontend compiles to static files in `apps/web/dist`. Serve with any static host (Vercel, Cloudflare Pages, Netlify, or a plain `serve` command):

```bash
bunx serve apps/web/dist
```

Point your reverse proxy at the server port (default `3000`) and the web dist directory (or CDN). Make sure `BETTER_AUTH_URL` matches the public domain your server is reachable at.
