// tests/helpers/d1.ts
// Async D1 test harness for the Workers lane (no sync better-sqlite3 calls in
// tests, no MEMORY=1).
//
// The D1 handle is a better-sqlite3 `:memory:` database wrapped by the `asD1`
// facade in `./d1Shim.ts`, so every test exercises the exact async D1 surface
// the Worker uses (`prepare().bind().all()/first()/run()`, `db.batch()` with
// atomic rollback). Migrations run through `applyMigrations` (the same
// `d1_migrations`-ledger runner wrangler uses) and seed-001.sql is applied
// statement-by-statement, byte-identical to the file.
//
// Why not miniflare here: miniflare v5 (`^5.20260930.0-alpha`) hangs on boot
// in this environment — even a trivial `getD1Database` never resolves within
// 120s with the bundled workerd binary — which would stall all 54 test files.
// The facade keeps the suite fast and hermetic while miniflare stays a devDep
// for `wrangler dev --local` flows. Swap `createHarness` back to miniflare
// once the v5 boot hang is fixed; the `D1Harness` interface is runtime-agnostic.

import Database from 'better-sqlite3';
import type { D1Database } from '@cloudflare/workers-types';
import { applyMigrations } from '../../server/db/migrateD1.js';
import { splitStatements } from '../../server/db/migrateD1.js';
import { asD1 } from './d1Shim.js';

export interface D1Harness {
  readonly db: D1Database;
  readonly env: { DB: D1Database };
  /** Applies migrations (idempotent). */
  applyMigrations(): Promise<void>;
  /** Applies seed-001.sql (idempotent). */
  applySeed(): Promise<void>;
  /** Seeds the database (alias of applySeed). */
  seed(): Promise<void>;
  /** Truncates all application tables and resets identity-like state. */
  resetTables(): Promise<void>;
  /** Closes the underlying database handle. */
  dispose(): Promise<void>;
}

const SEED_PATH = 'server/db/seed/seed-001.sql';

async function readSeed(): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const here = dirname(fileURLToPath(import.meta.url));
  return readFile(resolve(here, '..', '..', SEED_PATH), 'utf-8');
}

export async function createHarness(): Promise<D1Harness> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = asD1(sqlite);

  const harness: D1Harness = {
    db,
    env: { DB: db },
    async applyMigrations() {
      await applyMigrations(db);
    },
    async applySeed() {
      const sql = await readSeed();
      const statements = splitStatements(sql);
      if (statements.length === 0) return;
      await db.batch(statements.map((s) => db.prepare(s)));
    },
    async seed() {
      await this.applySeed();
    },
    async resetTables() {
      // Truncate in FK-safe order (children before parents where relevant).
      // Application tables present after migrations.
      const tables = [
        'route_pricing',
        'vehicle_pricing',
        'pricing_config',
        'content',
        'route_groups',
        'route_data',
        'locations',
        'faqs',
        'cars',
        'sessions',
        'admins',
      ];

      for (const t of tables) {
        // DELETE is fine for tests; no VACUUM needed.
        await db.prepare(`DELETE FROM ${t}`).run();
      }

      // Reset display_order sequences by re-applying display_order defaults
      // is not necessary; tests set explicit values. Also clear d1_migrations
      // not required (we want idempotent migrations). Keep schema_migrations
      // as-is (created by 0001_init.sql).
    },
    async dispose() {
      sqlite.close();
    },
  };

  return harness;
}
