// tests/d1-limits.guard.test.ts
// Guards the D1 cost of the three query functions that dominate real traffic,
// so an N+1 regression or an oversized statement fails CI instead of quietly
// eating the daily quota.
//
// WHAT IS GUARDED
//   getPublicData    — 4 fixed reads in 1 batch. No table is scanned twice, and
//                      the count must not move when rows are added.
//   getPricingData   — 4 fixed reads in 1 batch + 1 IN-chunked pricing read.
//                      THIS is the N+1 guard: statement count must track
//                      ceil(groups / 100), never the group count.
//   reorderEntities  — chunked existence check (max 100 params/statement) + one
//                      batched UPDATE per reordered row.
//
// HOW IT MEASURES
//   `asD1` (tests/helpers/d1Shim.ts) gives the better-sqlite3 handle a D1
//   interface; `instrumentDb` (server/db/d1Limits.ts) counts statements,
//   bound parameters and subrequests as they execute. `explainRowsRead` then
//   derives the D1 *rows read* figure from SQLite's own query plan, because
//   D1 bills rows scanned while better-sqlite3 only reports rows returned.
//
// The regression this file exists for is checked twice: once against the real
// functions, and once against a local replica of the old per-group query to
// prove the measurement actually discriminates.

process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Database from 'better-sqlite3';
import type { D1Database } from '@cloudflare/workers-types';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import {
  getPublicData,
  getPricingData,
  reorderEntities,
} from '../server/db/queries.js';
import {
  D1_LIMITS,
  budget,
  formatBudgetViolations,
  instrumentDb,
} from '../server/db/d1Limits.js';
import type { MeterSnapshot } from '../server/db/d1Limits.js';
import { asD1 } from './helpers/d1Shim.js';

/** Tables read by the public endpoints, in the order they are scanned. */
const TABLES = [
  'cars',
  'faqs',
  'route_data',
  'content',
  'locations',
  'route_groups',
  'route_pricing',
  'vehicle_pricing',
  'pricing_config',
] as const;

let sqlite: Database.Database;
let probed: ReturnType<typeof instrumentDb>;
let rowCounts: Record<string, number>;

/** Live row count for a table, so the scan model always matches the fixture. */
const counts = (table: string): number =>
  (sqlite.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number })
    .n;

/**
 * Return every table to the shipped seed state, so each test starts from the
 * production shape regardless of what the previous one inserted. Children are
 * deleted before parents: `route_pricing.route_group_id` is a foreign key into
 * `route_groups` and D1 enforces FKs unconditionally.
 */
function restoreSeed(): void {
  for (const table of [
    'route_pricing',
    'route_groups',
    ...TABLES.filter(
      (t) => t !== 'route_pricing' && t !== 'route_groups',
    ),
  ]) {
    sqlite.prepare(`DELETE FROM ${table}`).run();
  }
  sqlite.exec(readFileSync(resolve('server/db/seed/seed-001.sql'), 'utf8'));
  rowCounts = Object.fromEntries(TABLES.map((table) => [table, counts(table)]));
}

/**
 * Rows D1 charges for one statement, as a validated upper bound.
 *
 * D1 bills rows *scanned*. better-sqlite3 only reports rows *returned*, so the
 * two are reconciled per statement from the query plan:
 *
 *   `SCAN t`                 -> the whole table. Asserted: a bare scan has no
 *                               WHERE, so returned rows must equal row count.
 *   `SEARCH ... COVERING`    -> scanned = returned. The index answers the
 *                               projection itself, so no table row is touched.
 *   `SEARCH ... USING INDEX` -> one index entry plus the returned table rows, so
 *                               `rowsReturned + 1`. This is the `IN`-list case
 *                               that makes batching pay: a seek on
 *                               `route_pricing(route_group_id, vehicle_category)`
 *                               for one id reaches a 4-row range, so 7 ids read
 *                               28 rows, not 7.
 *
 * The `+1` is an upper bound. How D1's billing layer charges the index entry of
 * a non-covering seek is not documented, and the whole page load contains only
 * two such statements — a 2-row uncertainty against a 5,000,000-row quota.
 *
 * Any other plan shape throws, so a future query that filters after an index
 * seek fails loudly here instead of quietly reporting a figure that is too low.
 */
function explainRowsRead(statement: StatementRecord): number {
  const bound = Array.from({ length: statement.params }, () => 'plan-probe');
  const plan = (
    sqlite
      .prepare(`EXPLAIN QUERY PLAN ${statement.sql}`)
      .all(...bound) as Array<{ detail: string }>
  ).map((row) => row.detail);

  let covered = 0;
  for (const detail of plan) {
    if (/TEMP B-TREE/i.test(detail)) continue;

    const scan = /^\s*SCAN\s+(\w+)\s*$/i.exec(detail);
    if (scan !== null) {
      expect(
        statement.rowsReturned,
        `${statement.sql}: bare SCAN of ${scan[1]} must return all ${counts(scan[1])} rows`,
      ).toBe(counts(scan[1]));
      return statement.rowsReturned;
    }

    if (/^\s*SEARCH\s+\w+\s+USING\s+INDEX/i.test(detail)) {
      covered += /COVERING/i.test(detail) ? 0 : 1;
      continue;
    }

    throw new Error(
      `${statement.sql}: unrecognised query plan line "${detail}"`,
    );
  }
  return statement.rowsReturned + covered;
}

/**
 * Rows D1 charges for one statement, validated against its query plan.
 *
 * D1 counts rows *scanned*, so a `SELECT ... WHERE id = ?` on a primary key
 * costs 1, while `SELECT * FROM cars ORDER BY display_order` with no index on
 * `display_order` costs the whole table. `EXPLAIN QUERY PLAN` reports the same
 * access path D1's storage layer walks, which makes it the right oracle here:
 *
 *   `SCAN t`      -> every row of t
 *   `SEARCH t ..` -> the rows the index probes actually reach. For an `IN`
 *                    list that is every matching row, not one per value: a
 *                    lookup on `route_pricing(route_group_id, vehicle_category)`
 *                    for one group id lands on a 4-row range, so 7 ids over
 *                    4 vehicle categories read 28 rows, not 7.
 *
 * An unrecognised plan line contributes 0, so an unexpected plan under-counts
 * loudly (the total then fails the headroom assertions below) rather than
 * silently flattering the budget.
 */
function scanModelFor(statements: readonly StatementRecord[]): number {
  return statements.reduce(
    (sum, statement) =>
      statement.write ? sum : sum + explainRowsRead(statement),
    0,
  );
}

function reset() {
  probed.reset();
}

/** Run `fn` against a freshly-metered handle and return its counters. */
async function measure(fn: (db: D1Database) => Promise<unknown>): Promise<MeterSnapshot> {
  reset();
  await fn(probed.db);
  return probed.meter;
}

function insertRouteGroups(n: number, prefix = 'bulk'): void {
  const insert = sqlite.prepare(
    `INSERT INTO route_groups (id, type, nameAr, bidirectional, from_locations, to_locations, display_order)
     VALUES (?, 'travel', ?, 1, '[]', '[]', ?)`,
  );
  const insertPrice = sqlite.prepare(
    `INSERT INTO route_pricing (route_group_id, vehicle_category, one_way, round_trip)
     VALUES (?, 'sedan', 100, 200)`,
  );
  const tx = sqlite.transaction((count: number) => {
    for (let i = 0; i < count; i += 1) {
      const id = `${prefix}-${i}`;
      insert.run(id, `مجموعة ${i}`, i);
      insertPrice.run(id);
    }
  });
  tx(n);
}

function insertCars(n: number, prefix = 'bulkcar'): string[] {
  const insert = sqlite.prepare(
    `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
     VALUES (?, ?, 'sedan', 'سيدان', 'd', NULL, '[]', '[]', '[]', ?)`,
  );
  const ids: string[] = [];
  const tx = sqlite.transaction((count: number) => {
    for (let i = 0; i < count; i += 1) {
      const id = `${prefix}-${i}`;
      ids.push(id);
      insert.run(id, `سيارة ${i}`, i);
    }
  });
  tx(n);
  return ids;
}

beforeAll(() => {
  sqlite = getDb();
  migrate(sqlite);
  probed = instrumentDb(asD1(sqlite));
});

beforeEach(() => {
  restoreSeed();
  probed.reset();
});

describe('D1 limits — getPublicData', () => {
  it('costs exactly 4 statements in 1 batch, with no bound parameters', async () => {
    const meter = await measure(getPublicData);

    expect(meter.statementsExecuted).toBe(4);
    expect(meter.batches).toBe(1);
    expect(meter.subrequests).toBe(1);
    expect(meter.maxParamsInStatement).toBe(0);
    expect(meter.rowsWritten).toBe(0);
    expect(meter.statements.every((s) => s.batched)).toBe(true);
    expect(formatBudgetViolations(budget(meter))).toEqual([]);
  });

  it('reads each of content/cars/faqs/route_data exactly once — no N+1', async () => {
    const meter = await measure(getPublicData);
    const tables = meter.statements.map((s) =>
      /FROM (\w+)/i.exec(s.sql)?.[1],
    );

    expect(tables).toEqual(['content', 'cars', 'faqs', 'route_data']);
  });

  it('statement count is independent of how many rows exist', async () => {
    const before = (await measure(getPublicData)).statementsExecuted;
    insertCars(40, 'scale');
    const after = (await measure(getPublicData)).statementsExecuted;
    sqlite.prepare("DELETE FROM cars WHERE id LIKE 'scale-%'").run();

    expect(after).toBe(before);
  });
});

describe('D1 limits — getPricingData (N+1 guard)', () => {
  it('costs 5 statements / 2 subrequests at the seeded group count', async () => {
    const groups = counts('route_groups');
    const meter = await measure(getPricingData);

    expect(meter.statementsExecuted).toBe(4 + Math.ceil(groups / D1_LIMITS.boundParamsPerStatement));
    expect(meter.subrequests).toBe(2);
    expect(meter.maxParamsInStatement).toBe(groups);
    expect(meter.rowsWritten).toBe(0);
    expect(formatBudgetViolations(budget(meter))).toEqual([]);
  });

  it('grows as ceil(groups/100), NOT as one query per group', async () => {
    const observed: Array<{ groups: number; statements: number }> = [];

    for (const groups of [0, 1, 5, 100, 250]) {
      sqlite.prepare('DELETE FROM route_pricing').run();
      sqlite.prepare('DELETE FROM route_groups').run();
      insertRouteGroups(groups);
      const meter = await measure(getPricingData);
      observed.push({ groups, statements: meter.statementsExecuted });

      expect(meter.statementsExecuted).toBe(
        4 + Math.ceil(groups / D1_LIMITS.boundParamsPerStatement),
      );
      expect(meter.maxParamsInStatement).toBeLessThanOrEqual(
        D1_LIMITS.boundParamsPerStatement,
      );
    }

    // 250 groups must not cost 250 pricing queries.
    expect(observed).toEqual([
      { groups: 0, statements: 4 },
      { groups: 1, statements: 5 },
      { groups: 5, statements: 5 },
      { groups: 100, statements: 5 },
      { groups: 250, statements: 7 },
    ]);
    // The whole point: 250x the data costs 2 extra statements, not 246.
    expect(observed[4].statements - observed[0].statements).toBeLessThan(4);
  });

  it('detects the per-group query shape the batched code replaced', async () => {
    // The pre-batch implementation, reproduced verbatim in shape: one pricing
    // read per route group. If this replica of the old code measures the same as
    // the current code, the guard above proves nothing.
    const perGroup = async (
      db: D1Database,
      ids: readonly string[],
    ): Promise<number> => {
      let reads = 0;
      for (const id of ids) {
        const { results } = await db
          .prepare(
            `SELECT route_group_id, vehicle_category, one_way, round_trip
             FROM route_pricing WHERE route_group_id = ?`,
          )
          .bind(id)
          .all();
        reads += results.length;
      }
      return reads;
    };

    sqlite.prepare('DELETE FROM route_pricing').run();
    sqlite.prepare('DELETE FROM route_groups').run();
    insertRouteGroups(250);

    const ids = sqlite
      .prepare('SELECT id FROM route_groups')
      .all()
      .map((row) => (row as { id: string }).id);

    const nPlusOne = await measure((db) => perGroup(db, ids));
    const batched = await measure(getPricingData);

    expect(nPlusOne.statementsExecuted).toBe(250);
    expect(nPlusOne.subrequests).toBe(250);
    expect(batched.statementsExecuted).toBe(7);

    // And the old shape is genuinely unsafe: it alone breaches the free-tier
    // per-invocation subrequest cap, while the shipped code stays far under it.
    expect(nPlusOne.worstCaseSubrequests).toBeGreaterThan(
      D1_LIMITS.subrequestsPerInvocation,
    );
    expect(batched.worstCaseSubrequests).toBeLessThan(
      D1_LIMITS.subrequestsPerInvocation,
    );
  });
});

describe('D1 limits — reorderEntities', () => {
  it('chunk-checks existence at 100 params and batches the updates', async () => {
    const locations = sqlite
      .prepare('SELECT id FROM locations')
      .all()
      .map((row) => (row as { id: string }).id)
      .reverse();

    const meter = await measure((db) => reorderEntities(db, 'locations', locations));

    expect(meter.statementsExecuted).toBe(
      Math.ceil(locations.length / D1_LIMITS.boundParamsPerStatement) + locations.length,
    );
    expect(meter.batches).toBe(1);
    expect(meter.largestBatchStatements).toBe(locations.length);
    expect(meter.maxParamsInStatement).toBeLessThanOrEqual(
      D1_LIMITS.boundParamsPerStatement,
    );
    expect(meter.rowsWritten).toBe(locations.length);
    expect(formatBudgetViolations(budget(meter))).toEqual([]);
  });

  it('stays inside the subrequest cap at the shipped seed size', async () => {
    // The largest reorderable table in the seed is `locations`. Under either
    // subrequest model the whole call must fit the free-tier ceiling.
    const ids = sqlite
      .prepare('SELECT id FROM locations')
      .all()
      .map((row) => (row as { id: string }).id);

    const meter = await measure((db) => reorderEntities(db, 'locations', ids));

    expect(meter.subrequests).toBe(2);
    expect(meter.worstCaseSubrequests).toBe(ids.length + 1);
    expect(meter.worstCaseSubrequests).toBeLessThanOrEqual(
      D1_LIMITS.subrequestsPerInvocation,
    );
  });

  it('documents the row count at which a single reorder breaches the cap', async () => {
    // Recorded as a limit rather than asserted away: `reorderEntities` batched
    // N UPDATEs into one call precisely so they cost one round trip, but if
    // Cloudflare ever charged a subrequest per statement in a batch, a reorder
    // larger than this would exceed the free-tier per-invocation ceiling.
    // `server/db/LIMITS.md` carries the same number.
    const safe = D1_LIMITS.subrequestsPerInvocation - 1;
    sqlite.prepare('DELETE FROM cars').run();
    const ids = insertCars(safe, 'cap');

    const meter = await measure((db) => reorderEntities(db, 'cars', ids));

    expect(meter.subrequests).toBe(2);
    expect(meter.worstCaseSubrequests).toBe(safe + 1);

    sqlite.prepare('DELETE FROM cars').run();
    const over = insertCars(safe + 1, 'cap2');
    const next = await measure((db) => reorderEntities(db, 'cars', over));

    expect(formatBudgetViolations(budget(next))).toEqual([
      `subrequests/invocation (pessimistic: 1 per statement): ${safe + 2} > 50 (${((safe + 2) / 50 * 100).toFixed(1)}% of cap)`,
    ]);
  });

  it('rejects a duplicate/unknown id before writing anything', async () => {
    sqlite.prepare('DELETE FROM cars').run();
    const ids = insertCars(3, 'guard');

    await expect(
      reorderEntities(probed.db, 'cars', [ids[0], ids[0], ids[1]]),
    ).rejects.toThrow(/duplicate/);
    await expect(
      reorderEntities(probed.db, 'cars', [ids[0], 'nope']),
    ).rejects.toThrow(/does not exist/);

    const rows = sqlite
      .prepare('SELECT display_order FROM cars ORDER BY id')
      .all() as Array<{ display_order: number }>;
    expect(rows.map((r) => r.display_order)).toEqual([0, 1, 2]);
  });
});

describe('D1 quota headroom', () => {
  it('a full page load stays three orders of magnitude under the daily caps', async () => {
    reset();
    await getPublicData(probed.db);
    await getPricingData(probed.db);
    const meter = probed.meter;

    const rowsRead = scanModelFor(meter.statements);
    const pageLoadsPerDay = Math.floor(D1_LIMITS.rowsReadPerDay / rowsRead);

    console.log(
      [
        '',
        '  D1 free-tier headroom (measured against the seeded database)',
        '  ---------------------------------------------------------------',
        `  seeded rows: ${JSON.stringify(rowCounts)}`,
        `  page load   : ${meter.statementsExecuted} statements, ` +
          `${meter.subrequests} D1 calls, ${rowsRead} rows read, ` +
          `${meter.rowsWritten} rows written`,
        `  read quota  : ${rowsRead} / ${D1_LIMITS.rowsReadPerDay} rows ` +
          `(${(rowsRead / D1_LIMITS.rowsReadPerDay * 100).toFixed(4)}%) ` +
          `-> ${pageLoadsPerDay.toLocaleString('en-US')} page loads/day`,
        `  subrequests : ${meter.worstCaseSubrequests} / ` +
          `${D1_LIMITS.subrequestsPerInvocation} per invocation ` +
          `(pessimistic model)`,
        `  max params  : ${meter.maxParamsInStatement} / ` +
          `${D1_LIMITS.boundParamsPerStatement} per statement`,
        `  max bytes   : ${meter.maxStatementBytes} / ` +
          `${D1_LIMITS.bytesPerStatement} per statement`,
        '',
      ].join('\n'),
    );

    expect(meter.statementsExecuted).toBe(9);
    expect(rowsRead).toBeGreaterThan(0);
    expect(rowsRead).toBeLessThan(D1_LIMITS.rowsReadPerDay / 1000);
    expect(meter.rowsWritten).toBe(0);
    expect(formatBudgetViolations(budget(meter))).toEqual([]);
  });

  it('an admin reorder session stays far under the write quota', async () => {
    const ids = sqlite
      .prepare('SELECT id FROM locations')
      .all()
      .map((row) => (row as { id: string }).id);

    const meter = await measure((db) => reorderEntities(db, 'locations', ids));
    const reordersPerDay = Math.floor(
      D1_LIMITS.rowsWrittenPerDay / meter.rowsWritten,
    );

    console.log(
      [
        '',
        `  Admin reorder cost (${ids.length} rows, one full-table reorder)`,
        '  ---------------------------------------------------------------',
        `  statements  : ${meter.statementsExecuted} ` +
          `(${meter.batches} batch of ${meter.largestBatchStatements})`,
        `  rows written: ${meter.rowsWritten} / ` +
          `${D1_LIMITS.rowsWrittenPerDay} daily ` +
          `(${(meter.rowsWritten / D1_LIMITS.rowsWrittenPerDay * 100).toFixed(4)}%) ` +
          `-> ${reordersPerDay.toLocaleString('en-US')} full reorders/day`,
        '',
      ].join('\n'),
    );

    expect(meter.rowsWritten).toBe(ids.length);
    expect(reordersPerDay).toBeGreaterThan(300);
  });
});

describe('D1 limits — meter self-test', () => {
  it('rejects a statement carrying more than 100 bound parameters', async () => {
    sqlite.prepare('DELETE FROM cars').run();
    const ids = insertCars(101, 'oversized');

    // The IN-chunking in queries.ts keeps every statement at <= 100 params.
    // Re-issuing the same shape unchunked is what the guard must catch.
    const meter = await measure(async (db) => {
      await db
        .prepare(
          `SELECT id FROM cars WHERE id IN (${ids.map(() => '?').join(', ')})`,
        )
        .bind(...ids)
        .all();
    });

    expect(meter.maxParamsInStatement).toBe(101);
    expect(formatBudgetViolations(budget(meter))).toEqual([
      'params/statement: 101 > 100 (101.0% of cap)',
    ]);
  });
});