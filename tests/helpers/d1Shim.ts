// tests/helpers/d1Shim.ts
// A `D1Database` facade over a better-sqlite3 database, so the D1-shaped query
// layer in `server/db/queries.ts` can be exercised by Vitest on Node.
//
// `queries.ts` was moved off the better-sqlite3 API onto D1: promises instead
// of sync returns, `db.batch()` instead of `db.transaction()`, and
// `.bind(...values).all<T>()` instead of `.run(values)`. better-sqlite3 has no
// `batch` and no `bind`, so those call sites cannot run against a raw
// better-sqlite3 handle. This module supplies the missing surface — nothing in
// `server/` changes, and no query semantics are altered: each D1 call maps onto
// the equivalent better-sqlite3 call.
//
// Only the members `queries.ts` actually uses are implemented. `withSession`
// and `dump` exist to satisfy the `D1Database` type and throw rather than
// silently returning wrong data.

import type Database from 'better-sqlite3';
import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '@cloudflare/workers-types';
import { isWriteStatement } from '../../server/db/d1Limits.js';

/** better-sqlite3 accepts only these as bound values; D1 accepts more. */
type Bindable = string | number | bigint | Buffer | null;

/**
 * Leading keywords whose better-sqlite3 form returns rows (`.all()`).
 * Everything else — INSERT/UPDATE/DELETE/REPLACE, DDL (CREATE/DROP/ALTER),
 * and WITH-led writes like the 0004 backfill's `WITH ... UPDATE` — executes
 * via `.run()`. `isWriteStatement` alone is not enough: it misses DDL and
 * WITH-led writes, which better-sqlite3 rejects under `.all()` with "This
 * statement does not return data".
 */
const READ_KEYWORD = /^\s*(?:SELECT|VALUES|EXPLAIN|PRAGMA)\b/i;

/**
 * The SQL text and bound values behind a D1PreparedStatement. better-sqlite3
 * validates at `prepare()` time while D1 prepares lazily at execution, so the
 * wrapper never prepares up front: every `all()`/`first()`/`run()`/`raw()`
 * and every batched statement prepares fresh from `sql`. That is what lets a
 * migration file ALTER a table and touch the new column in the same batch.
 * `batch()` needs this handle (not the wrapper's own `run()`) to run the
 * whole sequence inside one transaction: individual `run()` calls would not be
 * atomic and, if the handle is wrapped by `instrumentDb`, would count every
 * statement twice.
 */
const RAW = Symbol('d1Shim.raw');

interface RawStatement {
  readonly values: readonly unknown[];
  readonly sql: string;
}

interface D1Meta {
  readonly changes: number;
  readonly last_row_id: number;
  /**
   * better-sqlite3 cannot report rows *scanned*, so this is rows *returned*.
   * D1's own `rows_read` means rows examined. The daily read-quota model in
   * `d1-limits.guard.test.ts` is therefore analytic, not read off this field.
   */
  readonly rows_read: number;
  readonly rows_written: number;
  readonly duration: number;
}

function metaFor(changes: number, lastRowId: number, rowCount: number): D1Meta {
  return {
    changes,
    last_row_id: lastRowId,
    rows_read: rowCount,
    rows_written: changes,
    duration: 0,
  };
}

function toBindable(value: unknown): Bindable {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return value;
  }
  if (value instanceof Buffer) return value;
  // D1 accepts booleans; better-sqlite3 rejects them. Translate, so a test does
  // not fail on a type difference D1 itself would not have hit.
  if (typeof value === 'boolean') return value ? 1 : 0;
  throw new TypeError(
    `d1Shim: unsupported bound value of type ${typeof value}`,
  );
}

function args(values: readonly unknown[]): Bindable[] {
  return values.map(toBindable);
}

/** Wrap `db` in the D1 interface. Pass the result to `instrumentDb()` next. */
export function asD1(db: Database.Database): D1Database {
  const prepare = (
    sql: string,
    values: readonly unknown[],
  ): D1PreparedStatement => {
    const raw: RawStatement = { values, sql };
    const exec = (): Database.Statement => db.prepare(sql);
    const statement = {
      bind: (...next: unknown[]) => prepare(sql, next),
      all: async <T = unknown>(): Promise<D1Result<T>> => {
        const stmt = exec();
        const rows = (values.length === 0
          ? stmt.all()
          : stmt.all(...args(values))) as T[];
        return {
          success: true,
          results: rows,
          meta: metaFor(0, 0, rows.length),
        };
      },
      first: async <T = unknown>(): Promise<T | null> => {
        const stmt = exec();
        const row = (values.length === 0
          ? stmt.get()
          : stmt.get(...args(values))) as T | undefined;
        return row ?? null;
      },
      run: async (): Promise<D1Result> => {
        const stmt = exec();
        const info = values.length === 0
          ? stmt.run()
          : stmt.run(...args(values));
        return {
          success: true,
          results: [],
          meta: metaFor(info.changes, Number(info.lastInsertRowid)),
        };
      },
      raw: async <T = unknown>(): Promise<T[]> =>
        (values.length === 0
          ? exec().raw()
          : exec().raw(...args(values))) as unknown as T[],
    } as unknown as D1PreparedStatement;

    Object.defineProperty(statement, RAW, { value: raw, enumerable: false });
    Object.defineProperty(statement, 'sql', { value: sql, enumerable: true });
    return statement;
  };

  return {
    prepare: (sql: string): D1PreparedStatement => prepare(sql, []),

    // D1 makes a batch one transaction that aborts the entire sequence when any
    // statement fails. better-sqlite3's `transaction()` gives the same
    // guarantee, which is what `reorderEntities` and `deleteRouteGroup` rely on
    // for their rollback-on-error behaviour.
    batch: async <T = unknown>(
      statements: D1PreparedStatement[],
    ): Promise<D1Result<T>[]> => {
      const run = db.transaction(() =>
        statements.map((statement) => {
          const raw = (statement as unknown as Record<symbol, RawStatement>)[RAW];
          if (raw === undefined) {
            throw new TypeError(
              'd1Shim: batch() received a statement not produced by asD1()',
            );
          }
          // Re-prepare at execution time, in order: D1 prepares each batched
          // statement when it runs, so a migration file can ALTER a table and
          // then touch the new column in the same batch. Preparing everything
          // up front would validate later statements against the old schema.
          const fresh = db.prepare(raw.sql);
          const bound = args(raw.values);
          if (isWriteStatement(raw.sql) || !READ_KEYWORD.test(raw.sql)) {
            const info = bound.length === 0
              ? fresh.run()
              : fresh.run(...bound);
            return {
              success: true,
              results: [],
              meta: metaFor(info.changes, Number(info.lastInsertRowid)),
            } satisfies D1Result<T>;
          }
          // A batched SELECT still has to hand its rows back. better-sqlite3's
          // `run()` executes a SELECT and throws the results away, so reads must
          // go through `all()` — this is what D1's batch contract requires.
          const rows = (bound.length === 0
            ? fresh.all()
            : fresh.all(...bound)) as T[];
          return {
            success: true,
            results: rows,
            meta: metaFor(0, 0, rows.length),
          } satisfies D1Result<T>;
        }),
      );
      return run();
    },

    exec: async (query: string): Promise<D1ExecResult> => {
      db.exec(query);
      return { count: 0, duration: 0 };
    },

    dump: async (): Promise<ArrayBuffer> => {
      throw new Error('d1Shim: dump() is not supported');
    },

    withSession: (): never => {
      throw new Error('d1Shim: withSession() is not supported');
    },
  } as unknown as D1Database;
}