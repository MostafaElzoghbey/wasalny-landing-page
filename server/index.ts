import { serve } from '@hono/node-server';
import { app } from './app.js';
import { getDb } from './db/connection.js';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';

// Boot the database: create the schema (migrate) and populate it with the
// static site content (seed). `seed` is idempotent, so running it on every
// boot is safe — a fresh production database gets data without clobbering an
// existing one.
function boot(): void {
  const db = getDb();
  migrate(db);
  seed(db);
}

const port = Number(process.env.PORT ?? 8787);

boot();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Wasalny server listening on http://localhost:${info.port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`);
});
