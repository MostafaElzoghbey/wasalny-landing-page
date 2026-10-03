// server/db/migrateD1.ts
// D1-native async migration runner.
//
// Mirrors `wrangler d1 migrations apply` against the `d1_migrations` ledger so a
// D1 database built in-process (miniflare in Vitest, or a throwaway local D1)
// ends up in exactly the state wrangler produces. See
// `server/db/migrations/LEDGER.md` for the `schema_migrations` vs
// `d1_migrations` mapping.
//
// Differences from `server/db/migrate.ts`, all required by D1:
//
//   * ledger table: `d1_migrations(name TEXT UNIQUE, ...)` holding the full
//     filename (`0001_init.sql`), matching wrangler — so a database migrated
//     here reports "No migrations to apply!" to wrangler, and vice versa.
//   * no `BEGIN`/`COMMIT`: D1 rejects explicit transaction control. Each
//     `db.batch()` is the transaction, and a failing statement rejects the whole
//     batch atomically.
//   * statements are split and sent through `prepare()` rather than handed to
//     `exec()` as one blob: `D1Database.exec` rejects a file that opens with
//     `--` comments ("SQL code did not contain a statement") and rejects
//     multi-statement files ("incomplete input").

import type { D1Database } from '@cloudflare/workers-types';

const MIGRATIONS_DIR = 'server/db/migrations';

/**
 * Hardcoded so the runner has no `node:fs` dependency and stays Workers-safe.
 * Must stay in sync with the files in `server/db/migrations/`, and the order is
 * the same order wrangler applies them in.
 */
const MIGRATIONS: readonly string[] = [
  '0001_init.sql',
  '0002_add_display_order.sql',
  '0003_remove_car_name_passengers.sql',
  '0004_backfill_display_order.sql',
  '0005_route_data_labels.sql',
  '0006_auth_username.sql',
  '0007_photos.sql',
];

/**
 * DDL for wrangler's ledger table, reproduced because `d1_migrations` is created
 * by wrangler itself and will not exist on a hand-built database. `IF NOT
 * EXISTS` keeps this a no-op against a wrangler-created ledger.
 */
const LEDGER_DDL = `CREATE TABLE IF NOT EXISTS d1_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

/**
 * Splits a migration file into individual statements.
 *
 * Strips whole-line `--` comments (trailing comments are left alone: the
 * migrations only use leading ones, and a `--` inside a string literal must not
 * be touched), then splits on `;` while skipping separators inside `'...'`
 * literals. The migrations contain no escaped-quote or semicolon-in-literal
 * cases, but the literal tracking is what keeps that from silently mattering.
 */
export function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');

  const statements: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < withoutComments.length; i += 1) {
    const char = withoutComments[i]!;

    if (char === "'") {
      inString = !inString;
      current += char;
      continue;
    }

    if (char === ';' && !inString) {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = '';
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing.length > 0) statements.push(trailing);

  return statements;
}

/** Result of a {@link applyMigrations} call. */
export interface MigrationResult {
  /** Filenames applied by this call, in application order. */
  readonly applied: readonly string[];
  /** Filenames already present in `d1_migrations` before this call. */
  readonly skipped: readonly string[];
}

export interface ApplyMigrationsOptions {
  /**
   * Resolves a migration filename to its SQL text. Defaults to reading
   * `server/db/migrations` off disk; inject it to keep this module free of
   * `node:fs` in Workers builds.
   */
  readonly readFile?: (filename: string) => Promise<string>;
  /** Migration filenames in application order. */
  readonly migrations?: readonly string[];
}

async function defaultReadFile(filename: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const { dirname, resolve } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const here = dirname(fileURLToPath(import.meta.url));
  return readFile(resolve(here, 'migrations', filename), 'utf-8');
}

/**
 * Applies every pending migration idempotently against the `d1_migrations`
 * ledger, one `db.batch()` per file so a failure leaves that file unapplied and
 * the ledger consistent.
 */
export async function applyMigrations(
  db: D1Database,
  options: ApplyMigrationsOptions = {},
): Promise<MigrationResult> {
  const readFile = options.readFile ?? defaultReadFile;
  const migrations = options.migrations ?? MIGRATIONS;

  await db.prepare(LEDGER_DDL).run();

  const applied: string[] = [];
  const skipped: string[] = [];

  for (const filename of migrations) {
    const alreadyApplied = await db
      .prepare('SELECT 1 FROM d1_migrations WHERE name = ?')
      .bind(filename)
      .first<{ '1': number }>();

    if (alreadyApplied) {
      skipped.push(filename);
      continue;
    }

    const statements = splitStatements(await readFile(filename));

    // The ledger row is part of the same batch, so it lands atomically with the
    // schema change: a partial file can never be recorded as applied.
    await db.batch([
      ...statements.map((sql) => db.prepare(sql)),
      db
        .prepare(
          'INSERT INTO d1_migrations (name) VALUES (?) ON CONFLICT (name) DO NOTHING',
        )
        .bind(filename),
    ]);

    applied.push(filename);
  }

  return { applied, skipped };
}

/** Filenames already recorded in `d1_migrations`, in application order. */
export async function appliedMigrations(
  db: D1Database,
): Promise<string[]> {
  const rows = await db
    .prepare('SELECT name FROM d1_migrations')
    .all<{ name: string }>();

  return rows.results.map((row) => row.name);
}

/** Directory wrangler reads migrations from; asserted by the contract suite. */
export const MIGRATIONS_DIR_FOR_WRANGLER = MIGRATIONS_DIR;
