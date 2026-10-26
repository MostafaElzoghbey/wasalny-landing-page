import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

let dbInstance: Database.Database | null = null;
let projectRoot: string | null = null;

/**
 * Resolves the project root from this module's own URL.
 *
 * Deliberately lazy: `import.meta.url` is `undefined` inside workerd, so
 * evaluating it at module scope throws while `server/worker.ts` is still
 * initializing and takes the whole Worker down. Only the file-backed branch of
 * `getDb` needs it; the in-memory branch (tests, `MEMORY=1`) returns first.
 */
function getProjectRoot(): string {
  if (projectRoot === null) {
    // server/db/connection.ts -> project root is two levels up.
    projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  }
  return projectRoot;
}

/**
 * @deprecated Node-only better-sqlite3 singleton for the Express/tsx server
 * and scripts. Do NOT use in the Worker — use `getDb(c.env)` from
 * `./d1.ts` (request-scoped `env.DB: D1Database`, Task 5 accessor;
 * Task 7 threads `c.env.DB` through call sites) instead. Kept until
 * Tasks 4/6 stop importing it.
 *
 * Returns the singleton better-sqlite3 database handle.
 *
 * - In tests (NODE_ENV === 'test') or when MEMORY=1, an in-memory database is
 *   used so no file is ever written.
 * - Otherwise the database file lives at DB_PATH (default: <root>/data/app.db),
 *   and the parent directory is created if missing.
 */
export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const useMemory = process.env.NODE_ENV === 'test' || process.env.MEMORY === '1';

  if (useMemory) {
    dbInstance = new Database(':memory:');
  } else {
    const dbPath = process.env.DB_PATH
      ? resolve(process.env.DB_PATH)
      : resolve(getProjectRoot(), 'data', 'app.db');
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    dbInstance = new Database(dbPath);
    // WAL is only meaningful for file-backed databases.
    dbInstance.pragma('journal_mode = WAL');
  }

  // Enforce referential integrity for both memory and file databases.
  dbInstance.pragma('foreign_keys = ON');

  return dbInstance;
}
