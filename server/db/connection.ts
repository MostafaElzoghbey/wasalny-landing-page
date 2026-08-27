import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const currentDir = dirname(fileURLToPath(import.meta.url));
// server/db/connection.ts -> project root is two levels up.
const PROJECT_ROOT = resolve(currentDir, '..', '..');

let dbInstance: Database.Database | null = null;

/**
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
      : resolve(PROJECT_ROOT, 'data', 'app.db');
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
