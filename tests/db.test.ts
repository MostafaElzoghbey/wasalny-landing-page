import { describe, it, expect, beforeAll } from 'vitest';
import { migrate } from '../server/db/migrate.js';
import { getDb } from '../server/db/connection.js';

// The authoritative DDL in the task enumerates exactly these 12 tables.
// (The task text says "16" but only lists 12; we assert the 12 that are
// concretely specified so the test is GREEN against the real schema.)
const EXPECTED_TABLES = [
  'locations',
  'route_groups',
  'route_pricing',
  'vehicle_pricing',
  'pricing_config',
  'cars',
  'content',
  'faqs',
  'route_data',
  'admins',
  'sessions',
  'schema_migrations',
] as const;

describe('db migration', () => {
  beforeAll(() => {
    // Force an in-memory database so the test never touches data/app.db.
    process.env.NODE_ENV = 'test';
  });

  it('creates all expected tables on an in-memory database', () => {
    const db = getDb();
    migrate(db);

    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const tables = new Set(rows.map((r) => r.name));

    for (const table of EXPECTED_TABLES) {
      expect(tables.has(table), `expected table "${table}" to exist`).toBe(true);
    }
  });

  it('is idempotent: migrate() can be called repeatedly without throwing', () => {
    const db = getDb();

    expect(() => {
      migrate(db);
      migrate(db);
      migrate(db);
    }).not.toThrow();

    const rows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>;
    const tables = new Set(rows.map((r) => r.name));

    for (const table of EXPECTED_TABLES) {
      expect(tables.has(table), `expected table "${table}" after re-migrate`).toBe(true);
    }

    // The schema_migrations bookkeeping row must be inserted exactly once.
    const count = (
      db
        .prepare("SELECT COUNT(*) AS c FROM schema_migrations WHERE version = '0001'")
        .get() as { c: number }
    ).c;
    expect(count).toBe(1);
  });
});
