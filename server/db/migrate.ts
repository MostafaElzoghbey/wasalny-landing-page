import type Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { getDb } from './connection.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(currentDir, 'migrations');

const SCHEMA_VERSION = '0001';

/**
 * Applies the initial schema idempotently.
 *
 * Reads 0001_init.sql, executes every `CREATE TABLE IF NOT EXISTS` statement
 * inside a single transaction, then records the migration version in
 * `schema_migrations` (only if not already present). Safe to call any number
 * of times.
 */
export function migrate(db: Database.Database = getDb()): void {
  const sql = readFileSync(resolve(MIGRATIONS_DIR, '0001_init.sql'), 'utf-8');

  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const run = db.transaction(() => {
    for (const statement of statements) {
      db.exec(statement);
    }

    const alreadyApplied = db
      .prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
      .get(SCHEMA_VERSION);
    if (!alreadyApplied) {
      db.prepare(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      ).run(SCHEMA_VERSION, new Date().toISOString());
    }
  });

  run();
}

// Run directly via `npm run db:migrate` / `tsx server/db/migrate.ts`,
// but never as a side effect of being imported (e.g. by the test suite).
const isExecutedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  migrate();
  process.stdout.write('Migration 0001 applied.\n');
  process.exit(0);
}
