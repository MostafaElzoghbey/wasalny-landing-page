import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from '../server/db/migrate.js';
import { getDb } from '../server/db/connection.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(currentDir, '..', 'server', 'db', 'migrations');
const PRE_0005_MIGRATIONS = [
  '0001_init.sql',
  '0002_add_display_order.sql',
  '0003_remove_car_name_passengers.sql',
  '0004_backfill_display_order.sql',
] as const;

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

    // Each migration version must be recorded exactly once.
    const count0001 = (
      db
        .prepare("SELECT COUNT(*) AS c FROM schema_migrations WHERE version = '0001_init'")
        .get() as { c: number }
    ).c;
    expect(count0001).toBe(1);
    const count0002 = (
      db
        .prepare("SELECT COUNT(*) AS c FROM schema_migrations WHERE version = '0002_add_display_order'")
        .get() as { c: number }
    ).c;
    expect(count0002).toBe(1);
  });

  it('0005 adds fromLabel/toLabel and backfills them from the legacy content.routes row', () => {
    // Given: a pre-0005 database built from migrations 0001-0004 only.
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    for (const file of PRE_0005_MIGRATIONS) {
      db.exec(readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8'));
    }

    // And: a legacy content 'routes' row plus route_data rows without labels.
    db.prepare('INSERT INTO content (key, value) VALUES (?, ?)').run(
      'routes',
      JSON.stringify([
        {
          id: 'legacy-1',
          from: 'دمياط',
          to: 'القاهرة',
          duration: '3 ساعات',
          description: 'رحلة مريحة عبر الطريق الساحلي',
        },
      ]),
    );
    const insertRoute = db.prepare(
      `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertRoute.run(
      'legacy-1',
      'دمياط - القاهرة',
      'رحلة مريحة',
      'ميتا',
      'وصف ميتا',
      'h.jpg',
      '150',
      '200 كم',
      '3 ساعات',
      '[]',
      '[]',
      0,
    );
    insertRoute.run(
      'orphan-1',
      'رحلة يتيمة',
      'وصف',
      'ميتا',
      'وصف ميتا',
      'h.jpg',
      '100',
      '100 كم',
      'ساعة',
      '[]',
      '[]',
      1,
    );

    // When: the real 0005 migration is applied.
    db.exec(readFileSync(resolve(MIGRATIONS_DIR, '0005_route_data_labels.sql'), 'utf8'));

    // Then: the two label columns exist.
    const columns = db
      .prepare('PRAGMA table_info(route_data)')
      .all() as Array<{ name: string }>;
    const columnNames = columns.map((c) => c.name);
    expect(columnNames).toContain('fromLabel');
    expect(columnNames).toContain('toLabel');

    // And: legacy-1 is backfilled from the content 'routes' JSON row.
    const legacy = db
      .prepare('SELECT fromLabel, toLabel FROM route_data WHERE id = ?')
      .get('legacy-1') as { fromLabel: string; toLabel: string };
    expect(legacy.fromLabel).toBe('دمياط');
    expect(legacy.toLabel).toBe('القاهرة');

    // And: a row with no matching legacy entry stays at ''.
    const orphan = db
      .prepare('SELECT fromLabel, toLabel FROM route_data WHERE id = ?')
      .get('orphan-1') as { fromLabel: string; toLabel: string };
    expect(orphan.fromLabel).toBe('');
    expect(orphan.toLabel).toBe('');

    // And: a row inserted after the migration with no labels defaults to ''.
    insertRoute.run(
      'post-1',
      'رحلة لاحقة',
      'وصف',
      'ميتا',
      'وصف ميتا',
      'h.jpg',
      '120',
      '150 كم',
      'ساعتان',
      '[]',
      '[]',
      2,
    );
    const post = db
      .prepare('SELECT fromLabel, toLabel FROM route_data WHERE id = ?')
      .get('post-1') as { fromLabel: string; toLabel: string };
    expect(post.fromLabel).toBe('');
    expect(post.toLabel).toBe('');
  });
});
