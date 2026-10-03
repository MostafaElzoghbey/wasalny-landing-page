import type Database from 'better-sqlite3';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';
import { getDb } from './connection.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(currentDir, 'migrations');

/**
 * Applies all pending schema migrations idempotently.
 *
 * Reads every *.sql file in the migrations directory (sorted by name),
 * checks `schema_migrations` for already-applied versions, and runs each
 * pending migration inside its own transaction. Safe to call any number of
 * times.
 */
export function migrate(db: Database.Database = getDb()): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.replace('.sql', '');

    // Legacy: the old hardcoded runner stored version '0001' for
    // 0001_init.sql.  Normalise so we never re-apply it.
    if (version === '0001_init') {
      db.prepare('UPDATE schema_migrations SET version = ? WHERE version = ?')
        .run('0001_init', '0001');
    }

    const alreadyApplied = db
      .prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
      .get(version);
    if (alreadyApplied) continue;

    const raw = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf-8');

    // Strip single-line comments (-- ...) so semicolons inside comments
    // don't break the split-based statement parser.
    const sql = raw
      .split('\n')
      .map((line) => {
        const commentIdx = line.indexOf('--');
        return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
      })
      .join('\n');

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const run = db.transaction(() => {
      for (const statement of statements) {
        db.exec(statement);
      }

      db.prepare(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      ).run(version, new Date().toISOString());
    });

    run();
  }
}

// Run directly via `npm run db:migrate` / `tsx server/db/migrate.ts`,
// but never as a side effect of being imported (e.g. by the test suite).
const isExecutedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  migrate();
  process.stdout.write('All migrations applied.\n');
  process.exit(0);
}
