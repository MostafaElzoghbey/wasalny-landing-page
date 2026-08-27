# Wasalny (وصلني) Landing Page

A passenger transport landing page for Wasalny (وصلني), a service based in Damietta, Egypt. The site is Arabic-first and right-to-left (RTL). It is built as a Vite + React 19 frontend backed by a Hono/Node + SQLite API, all in this single repository.

The public site is a content-driven marketing page (cars, routes, pricing, FAQs, locations). Content is managed through an admin dashboard and persisted in SQLite, which is the live source of truth. The static `src/data/*` modules are only used as a first-paint fallback before the live data loads.

## Prerequisites

- **Node.js** with a working native build toolchain (the project uses `better-sqlite3`, which compiles a native addon on install).
- **npm** (ships with Node).

## Install

```bash
npm install
```

This installs both the frontend dependencies and the server dependencies, and builds the native `better-sqlite3` addon.

## Development

Run both the Vite dev server and the Hono API together:

```bash
npm run dev:all
```

- Vite serves the frontend on its own port (printed in the terminal, typically `http://localhost:5173`).
- The Hono API runs on `:8787`.
- Vite proxies `/api` requests to `http://localhost:8787`, so the frontend talks to the API as if it were same-origin.

Open the Vite URL in your browser. The app initializes from the static `src/data/*` modules for first paint, then fetches `/api/data` and `/api/pricing` and overwrites them with the live database content.

You can also run the two processes separately:

```bash
npm run dev      # Vite dev server only
npm run server   # Hono API on :8787 (tsx watch)
```

## Production build

```bash
npm run build
```

This runs `npm run pwa:assets`, type-checks with `tsc -b`, and builds the frontend into `dist/`.

## Run in production

```bash
npm run start
```

This sets `NODE_ENV=production` and runs `tsx server/index.ts`. On boot the server:

1. Runs database migrations automatically and idempotently (creating `data/app.db` if needed).
2. Serves the JSON API under `/api/*`.
3. Serves the built frontend from `dist/` for all non-API routes.

The server listens on the port given by the `PORT` environment variable, or `8787` by default. It requires a Node host with write access to the `data/` directory (where `data/app.db` lives).

## Database

- The database is a SQLite file at `data/app.db`. It is gitignored and created automatically on first boot.
- Migrations run automatically at server start and are safe to run repeatedly.
- Seed the database once (or to reset content) with:

  ```bash
  npm run db:seed
  ```

  This populates the DB from the static `src/data/*` modules. It is idempotent: re-running it does not create duplicate rows.

## Admin

Create an admin account from the command line:

```bash
npm run admin:create <email> <password>
```

This creates the admin or updates the password if the email already exists.

Then open `/admin` in the browser, log in, and manage content through the dashboard UI:

- Cars
- FAQs
- Route Data
- Locations
- Route Groups
- Pricing Config
- Content

Changes persist to SQLite and appear immediately on the public site. Admin authentication uses a cookie session (no JWT). The dashboard talks to `/api/admin/*`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/data` | Public content (cars, FAQs, route data, locations, etc.) |
| `GET` | `/api/pricing` | Public pricing configuration |
| `POST` | `/api/admin/login` | Admin login (sets session cookie) |
| `POST` | `/api/admin/logout` | Admin logout |
| `GET` | `/api/admin/me` | Current admin session info |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/cars` | Admin CRUD for cars |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/faqs` | Admin CRUD for FAQs |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/route-data` | Admin CRUD for route data |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/content` | Admin CRUD for content |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/locations` | Admin CRUD for locations |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/route-groups` | Admin CRUD for route groups |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/route-pricing` | Admin CRUD for route pricing |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/vehicle-pricing` | Admin CRUD for vehicle pricing |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/admin/pricing-config` | Admin CRUD for pricing config |

## Environment variables

- `VITE_BASE_URL` / `BASE_URL`: base URL used by the frontend and/or server to locate the API. In development Vite proxies `/api` to the local Hono server, so this is typically not needed locally.
- `PORT`: port for the production server (defaults to `8787`).
- `NODE_ENV`: set to `production` by `npm run start`.

## Tests

```bash
npm test          # Vitest unit/integration tests
npm run test:e2e  # Playwright end-to-end tests
```

## Source of truth

The live source of truth for all site content is the SQLite database. The static `src/data/*` TypeScript modules exist only as an initial fallback so the page can render on first paint before the API responds. On mount, `useData()` from `DataProvider` (`src/context/DataProvider.tsx`) fetches `/api/data` and `/api/pricing` and overwrites the static values with the live database content.
