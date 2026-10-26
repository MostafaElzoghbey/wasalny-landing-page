// server/db/d1.ts
// Request-scoped D1 accessor for the Cloudflare Worker runtime.
//
// Use `getDb(c.env)` (or `getDb(env)`) inside request handlers so every
// request uses its own `env.DB` binding instead of the Node
// `better-sqlite3` singleton in `./connection.ts`.
//
// Local replacement for the old `MEMORY=1` / `DB_PATH` modes:
// run the Worker locally with `wrangler dev --local` (or
// `npx vitest` with miniflare) backed by local D1 instead of setting
// `MEMORY=1`. No `node:fs`, `node:path`, `node:url`, `node:process`, or
// `PRAGMA journal_mode = WAL` here — D1 manages storage/journaling.

import type { D1Database } from '@cloudflare/workers-types';

/** Worker bindings required by the API (mirrors `DB` in wrangler.jsonc). */
export interface AppEnv {
  DB: D1Database;
}

/**
 * Returns the request-scoped D1 database handle from the Worker bindings.
 * Throws when the `DB` binding is missing (e.g. wrangler `d1_databases`
 * not configured) so misconfiguration fails fast instead of producing
 * obscure `undefined` errors downstream.
 */
export function getDb(env: AppEnv): D1Database {
  if (!env?.DB) {
    throw new Error(
      'Missing D1 binding `DB`. Check d1_databases in wrangler.jsonc and use `wrangler dev --local` for local D1.',
    );
  }
  return env.DB;
}
