// server/db/d1Limits.ts
// D1 platform limits as named constants, plus a pass-through meter that counts
// what a query function actually costs D1: statements executed, bound
// parameters per statement, and subrequests per invocation.
//
// WHY THIS EXISTS
// D1 bills and rejects on four independent axes (rows read, rows written,
// bound parameters per statement, subrequests per invocation). Three of the
// four are invisible in the return value of a query function: `getPricingData`
// returns the same `PricingData` whether it costs 5 statements or 500. The
// only way to keep that honest is to measure, which is what
// `instrumentDb` does — it wraps a `D1Database`, forwards every call, and
// records the shape of the traffic on the way through.
//
// NOTHING HERE CHANGES QUERY SEMANTICS. `instrumentDb` is a decorator: same
// statements, same bindings, same order, same results. It is not wired into
// `server/routes/*`, so production pays zero cost; `tests/d1-limits.guard.test.ts`
// wraps the D1 handle to assert the budgets stay inside D1_LIMITS.
//
// SOURCES — Cloudflare D1 platform limits:
//   https://developers.cloudflare.com/d1/platform/limits/
//   https://developers.cloudflare.com/workers/platform/limits/
// Quota headroom math derived from these constants: `server/db/LIMITS.md`.

import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
} from '@cloudflare/workers-types';

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/**
 * Hard platform limits. Exceeding any of these is an error at request time, not
 * a slow path: `overLimit` in `tests/d1-limits.guard.test.ts` is the guard.
 *
 * Values verified against the docs on 2026-09-30 (D1 limits page
 * `dateModified: 2026-04-21`, Workers limits page `dateModified: 2026-09-05`).
 */
export const D1_LIMITS = {
  /** "Rows read measure how many rows a query reads (scans), regardless of the
   *  size of each row." A full scan of a 5000-row table costs 5000, even if the
   *  query returns 3 rows. Rows *returned* is not the metric. */
  rowsReadPerDay: 5_000_000,
  /** Free-plan daily write quota. Counts rows actually changed. */
  rowsWrittenPerDay: 100_000,
  /** "Maximum bound parameters per query | 100". Applies per statement,
   *  including each statement inside a `db.batch()`. */
  boundParamsPerStatement: 100,
  /** "Maximum SQL statement length | 100,000 bytes (100 KB)". Per statement,
   *  including each statement inside a batch. */
  bytesPerStatement: 100_000,
  /** "Maximum SQL query duration | 30 seconds", and the docs' footnote adds that
   *  the same limit "applies to the entire batch call" — so this bounds one
   *  standalone query and one whole `db.batch()` equally. */
  secondsPerBatch: 30,
  /** Workers Free: "Subrequests per invocation | 50". The D1 limits page states
   *  the same number as "Queries per Worker invocation | 50 (Free)". */
  subrequestsPerInvocation: 50,
  /** "Maximum number of columns per table | 100". (There is no documented
   *  column limit for a single statement.) */
  columnsPerTable: 100,
  /** "Maximum arguments per SQL function | 32". */
  argsPerSqlFunction: 32,
  /** "Maximum string, BLOB or table row size | 2,000,000 bytes (2 MB)". Binds
   *  how large a single `content.value` JSON blob may grow. */
  rowSizeBytes: 2_000_000,
} as const;

/**
 * Subrequest accounting — modelled two ways, because Cloudflare does not
 * document which is right.
 *
 * The Workers limits page defines a subrequest as "any request a Worker makes
 * using the Fetch API or to Cloudflare services like ... D1", but no page
 * states whether a `db.batch()` carrying N statements costs 1 subrequest or N.
 * Both models are therefore tracked and the guard enforces the stricter one:
 *
 *   - `subrequests` — batched model: one D1 call, one subrequest.
 *   - `worstCaseSubrequests` — pessimistic model: one per executed statement,
 *     equal to `statementsExecuted`.
 *
 * `budget()` asserts against `worstCaseSubrequests`, so the code stays correct
 * under either reading. Whichever is true in production, this is not the
 * binding constraint: the public read path is 9 statements against a cap of 50.
 */
export const SUBREQUESTS_PER_STATEMENT = 1;
export const SUBREQUESTS_PER_BATCH = 1;

// ---------------------------------------------------------------------------
// Meter
// ---------------------------------------------------------------------------

/** One executed statement, flattened for assertions and failure messages. */
export interface StatementRecord {
  /** SQL text, whitespace-collapsed so assertions can match on it. */
  readonly sql: string;
  /** Byte length of the SQL text, for the 100 KB per-statement cap. */
  readonly sqlBytes: number;
  /** Number of `?` placeholders actually bound. */
  readonly params: number;
  /** True when executed inside `db.batch()` rather than standalone. */
  readonly batched: boolean;
  /** Rows changed, from D1's `meta.changes`. 0 for reads. */
  readonly changes: number;
  /** Rows the statement returned. For a read this equals rows *scanned*
   *  whenever the plan is a bare table scan or a fully-covered index seek,
   *  which `tests/d1-limits.guard.test.ts` asserts per statement before using
   *  this as the D1 rows-read figure. */
  readonly rowsReturned: number;
  /** True when the leading keyword is INSERT/UPDATE/DELETE/REPLACE. */
  readonly write: boolean;
}

/** Cumulative counters for one instrumented database. */
export interface MeterSnapshot {
  /** `db.prepare()` calls. A statement is prepared once and may be executed
   *  many times (see `reorderEntities`, which prepares one UPDATE template and
   *  binds it per row), so this can exceed `statementsExecuted`. */
  readonly prepared: number;
  /** Total statements executed, batched and standalone. */
  readonly statementsExecuted: number;
  /** D1 subrequests under the batched model: one per standalone execution, one
   *  per `db.batch()` regardless of statement count. */
  readonly subrequests: number;
  /** Subrequests under the pessimistic model: one per executed statement.
   *  Identical to `statementsExecuted`. `budget()` asserts against this, so the
   *  guard holds whichever way Cloudflare actually counts a batch. */
  readonly worstCaseSubrequests: number;
  /** `db.batch()` calls. */
  readonly batches: number;
  /** Largest statement count in any single `db.batch()`. */
  readonly largestBatchStatements: number;
  /** Bound parameters summed across one `db.batch()` call's statements — the
   *  number that grows without limit when a per-row template is batched. */
  readonly largestBatchParams: number;
  /** Most bound parameters on any single statement. Compared against the hard
   *  100-per-statement cap. */
  readonly maxParamsInStatement: number;
  /** Largest SQL statement in bytes. Compared against the 100 KB cap. */
  readonly maxStatementBytes: number;
  /** Rows changed by writes, summed from `meta.changes`. Drives the write quota. */
  readonly rowsWritten: number;
  /** Flattened log, in execution order. */
  readonly statements: readonly StatementRecord[];
}

interface MutableMeter {
  prepared: number;
  statementsExecuted: number;
  subrequests: number;
  batches: number;
  largestBatchStatements: number;
  largestBatchParams: number;
  maxParamsInStatement: number;
  maxStatementBytes: number;
  rowsWritten: number;
  statements: StatementRecord[];
}

/** A `D1Database` plus its meter. `db` is safe to pass to `queries.ts`. */
export interface InstrumentedDb {
  readonly db: D1Database;
  /** Read the counters. Same object every call; it is mutated in place. */
  readonly meter: MeterSnapshot;
  /** Zero the counters without unwrapping, so one test can do several calls. */
  reset(): void;
}

const WRITE_KEYWORD =
  /^\s*(?:INSERT|UPDATE|DELETE|REPLACE)\b/i;

/** True when the statement mutates rows and therefore consumes write quota. */
export function isWriteStatement(sql: string): boolean {
  return WRITE_KEYWORD.test(sql);
}

/** Collapse whitespace so tests can assert on SQL without pinning formatting. */
export function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

/** Count `?` placeholders. Approximates SQLite's own binding count. */
export function countPlaceholders(sql: string): number {
  let count = 0;
  for (let i = 0; i < sql.length; i += 1) {
    if (sql[i] === '?') count += 1;
  }
  return count;
}

/**
 * Wrap `db` so every prepared statement and batch is counted, then forwarded
 * unchanged.
 *
 * The wrapper is deliberately thin: `prepare` returns a statement whose `bind`
 * returns a *new* wrapper (D1 statements are immutable once bound), and whose
 * `all`/`first`/`run` record the execution and then delegate. A statement
 * executed without an explicit `bind` still records its placeholder count, so
 * an accidentally unbound `?` shows up as `params > 0` on a zero-bind call
 * rather than as a runtime error only D1 would raise.
 */
export function instrumentDb(db: D1Database): InstrumentedDb {
  const state: MutableMeter = {
    prepared: 0,
    statementsExecuted: 0,
    subrequests: 0,
    batches: 0,
    largestBatchStatements: 0,
    largestBatchParams: 0,
    maxParamsInStatement: 0,
    maxStatementBytes: 0,
    rowsWritten: 0,
    statements: [],
  };

  // Queued batch statements have not executed, so nothing is in `statements`
  // yet — their sql/params must be read off the wrapper objects themselves.
  const queued = new WeakMap<
    D1PreparedStatement,
    { sql: string; params: number }
  >();

  const record = (
    sql: string,
    params: number,
    batched: boolean,
    changes: number,
    rowsReturned: number,
  ): void => {
    const sqlBytes = new TextEncoder().encode(sql).length;
    state.statementsExecuted += 1;
    state.maxParamsInStatement = Math.max(state.maxParamsInStatement, params);
    state.maxStatementBytes = Math.max(state.maxStatementBytes, sqlBytes);
    state.rowsWritten += changes;
    state.statements.push({
      sql: normalizeSql(sql),
      sqlBytes,
      params,
      batched,
      changes,
      rowsReturned,
      write: isWriteStatement(sql),
    });
  };

  const bindable = (
    sql: string,
    values: readonly unknown[],
  ): D1PreparedStatement => {
    // `db.prepare(sql).bind(a, b)` and `db.prepare(sql).bind(...[a, b])` are the
    // same call; queries.ts uses the spread form everywhere.
    const bound = db.prepare(sql).bind(...(values as never[]));
    const wrapper: D1PreparedStatement = {
      bind: (...next: unknown[]) => bindable(sql, next),
      all: async <T = unknown>(): Promise<D1Result<T>> => {
        const result = await bound.all<T>();
        record(
          sql,
          values.length,
          false,
          result.meta?.changes ?? 0,
          result.results?.length ?? 0,
        );
        state.subrequests += SUBREQUESTS_PER_STATEMENT;
        return result;
      },
      first: async <T = unknown>(): Promise<T | null> => {
        const row = await bound.first<T>();
        record(sql, values.length, false, 0, row === null ? 0 : 1);
        state.subrequests += SUBREQUESTS_PER_STATEMENT;
        return row;
      },
      run: async <T = Record<string, unknown>>(): Promise<D1Result<T>> => {
        const result = await bound.run<T>();
        record(
          sql,
          values.length,
          false,
          result.meta?.changes ?? 0,
          result.results?.length ?? 0,
        );
        state.subrequests += SUBREQUESTS_PER_STATEMENT;
        return result;
      },
      raw: (async <T = unknown[]>(
        options?: { columnNames?: false },
      ): Promise<T[]> => {
        const rows = await bound.raw<T>(options);
        record(sql, values.length, false, 0, rows.length);
        state.subrequests += SUBREQUESTS_PER_STATEMENT;
        return rows;
      }) as D1PreparedStatement['raw'],
    };
    // D1PreparedStatement.sql exists on the real type; keep it for parity so
    // debug output and any future logging can read the query text.
    Object.defineProperty(wrapper, 'sql', { value: sql, enumerable: true });
    // Pass through symbol-keyed handles so a backend layered *under* this meter
    // can still recognise the statement when it arrives inside a `db.batch()`.
    // Without this, `tests/helpers/d1Shim.ts` cannot reach the better-sqlite3
    // statement behind this wrapper and `batch()` rejects it as foreign.
    const inner = bound as unknown as Record<symbol, unknown>;
    for (const key of Reflect.ownKeys(inner)) {
      if (typeof key === 'symbol' && !(key in wrapper)) {
        Object.defineProperty(wrapper, key, { value: inner[key] });
      }
    }
    queued.set(wrapper, { sql, params: values.length });
    return wrapper;
  };

  const instrumented: D1Database = {
    prepare: (query: string): D1PreparedStatement => {
      state.prepared += 1;
      return bindable(query, []);
    },
    batch: async <T = unknown>(
      statements: D1PreparedStatement[],
    ): Promise<D1Result<T>[]> => {
      const meta = statements.map(
        (statement) => queued.get(statement) ?? { sql: '<unknown>', params: 0 },
      );
      const results = await db.batch<T>(statements);
      state.batches += 1;
      state.subrequests += SUBREQUESTS_PER_BATCH;
      state.largestBatchStatements = Math.max(
        state.largestBatchStatements,
        statements.length,
      );
      state.largestBatchParams = Math.max(
        state.largestBatchParams,
        meta.reduce((sum, entry) => sum + entry.params, 0),
      );
      for (const [index, result] of results.entries()) {
        const changes = result.meta?.changes ?? 0;
        state.rowsWritten += changes;
        state.statementsExecuted += 1;
        state.maxParamsInStatement = Math.max(
          state.maxParamsInStatement,
          meta[index].params,
        );
        state.statements.push({
          sql: normalizeSql(meta[index].sql),
          sqlBytes: new TextEncoder().encode(meta[index].sql).length,
          params: meta[index].params,
          batched: true,
          changes,
          rowsReturned: result.results?.length ?? 0,
          write: isWriteStatement(meta[index].sql),
        });
      }
      return results;
    },
    exec: async (query: string): Promise<D1ExecResult> => {
      // `exec()` is a multi-statement escape hatch and is not used by
      // queries.ts. Counted as one subrequest so it cannot hide from the budget.
      const result = await db.exec(query);
      state.subrequests += SUBREQUESTS_PER_STATEMENT;
      return result;
    },
    dump: async (): Promise<ArrayBuffer> => db.dump(),
    withSession: () => db.withSession('first-primary'),
  };

  return {
    db: instrumented,
    get meter(): MeterSnapshot {
      return {
        prepared: state.prepared,
        statementsExecuted: state.statementsExecuted,
        subrequests: state.subrequests,
        worstCaseSubrequests: state.statementsExecuted,
        batches: state.batches,
        largestBatchStatements: state.largestBatchStatements,
        largestBatchParams: state.largestBatchParams,
        maxParamsInStatement: state.maxParamsInStatement,
        maxStatementBytes: state.maxStatementBytes,
        rowsWritten: state.rowsWritten,
        statements: [...state.statements],
      };
    },
    reset(): void {
      state.prepared = 0;
      state.statementsExecuted = 0;
      state.subrequests = 0;
      state.batches = 0;
      state.largestBatchStatements = 0;
      state.largestBatchParams = 0;
      state.maxParamsInStatement = 0;
      state.maxStatementBytes = 0;
      state.rowsWritten = 0;
      state.statements = [];
    },
  };
}

// ---------------------------------------------------------------------------
// Budget assertions
// ---------------------------------------------------------------------------

/** One hard limit plus the measured value it is compared against. */
export interface BudgetCheck {
  readonly name: string;
  readonly measured: number;
  readonly limit: number;
  /** `measured / limit`, so `overLimit` reads directly as "fraction of cap". */
  readonly ratio: number;
}

/**
 * Every hard cap in `D1_LIMITS` that a query call can be measured against. Call
 * this after `meter.reset()` + the call under test, and the result is that
 * call's whole D1-limit surface.
 *
 * The subrequest cap is checked against `worstCaseSubrequests` (one per
 * statement) rather than the friendlier batched count, because the 50-subrequest
 * ceiling is per *invocation*: a page load that runs `getPublicData` then
 * `getPricingData` must be checked on the combined total, and the pessimistic
 * model is the one that cannot be wrong.
 */
export function budget(meter: MeterSnapshot): BudgetCheck[] {
  return [
    {
      name: 'subrequests/invocation (pessimistic: 1 per statement)',
      measured: meter.worstCaseSubrequests,
      limit: D1_LIMITS.subrequestsPerInvocation,
      ratio: meter.worstCaseSubrequests / D1_LIMITS.subrequestsPerInvocation,
    },
    {
      name: 'subrequests/invocation (batched: 1 per db call)',
      measured: meter.subrequests,
      limit: D1_LIMITS.subrequestsPerInvocation,
      ratio: meter.subrequests / D1_LIMITS.subrequestsPerInvocation,
    },
    {
      name: 'params/statement',
      measured: meter.maxParamsInStatement,
      limit: D1_LIMITS.boundParamsPerStatement,
      ratio: meter.maxParamsInStatement / D1_LIMITS.boundParamsPerStatement,
    },
    {
      name: 'bytes/statement',
      measured: meter.maxStatementBytes,
      limit: D1_LIMITS.bytesPerStatement,
      ratio: meter.maxStatementBytes / D1_LIMITS.bytesPerStatement,
    },
    {
      name: 'rows written per call',
      measured: meter.rowsWritten,
      limit: D1_LIMITS.rowsWrittenPerDay,
      ratio: meter.rowsWritten / D1_LIMITS.rowsWrittenPerDay,
    },
  ];
}

/** The budget checks whose measured value exceeds their limit. */
export function overLimit(checks: readonly BudgetCheck[]): BudgetCheck[] {
  return checks.filter((check) => check.measured > check.limit);
}

/**
 * `limit: actual` strings for every violated check. Intended for
 * `expect(overLimit(budget(meter))).toEqual([])`, so a regression prints the
 * name, the measured number and the cap in the diff instead of a bare boolean.
 */
export function formatBudgetViolations(
  checks: readonly BudgetCheck[],
): string[] {
  return overLimit(checks).map(
    (check) =>
      `${check.name}: ${check.measured} > ${check.limit} (${(check.ratio * 100).toFixed(1)}% of cap)`,
  );
}
