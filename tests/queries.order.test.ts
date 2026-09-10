process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import {
  createCar,
  getPublicData,
  reorderEntities,
} from '../server/db/queries.js';

describe('queries ordering', () => {
  let db: Database.Database;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    db = getDb();
    migrate(db);
  });

  beforeEach(() => {
    for (const table of [
      'cars',
      'faqs',
      'route_data',
      'content',
      'pricing_config',
      'locations',
      'route_groups',
      'route_pricing',
      'vehicle_pricing',
    ]) {
      db.prepare(`DELETE FROM ${table}`).run();
    }
  });

  function insertCar(id: string, displayOrder: number) {
    db.prepare(
      `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      `سيارة ${id}`,
      'sedan',
      'سيدان',
      'desc',
      null,
      '[]',
      '[]',
      '[]',
      displayOrder,
    );
  }

  it('createCar auto-assigns displayOrder = max + 1', () => {
    insertCar('car-1', 1);
    insertCar('car-2', 2);

    const created = createCar(db, {
      nameAr: 'سيدان',
      category: 'sedan',
      categoryAr: 'سيدان',
      description: 'desc',
      images: [],
      features: [],
    });

    expect(created.displayOrder).toBe(3);
  });

  it('createCar preserves explicit displayOrder 0', () => {
    insertCar('car-1', 1);
    insertCar('car-2', 2);

    const created = createCar(db, {
      nameAr: 'sidan',
      category: 'sedan',
      categoryAr: 'sidan',
      description: 'desc',
      images: [],
      features: [],
      displayOrder: 0,
    });

    expect(created.displayOrder).toBe(0);
  });

  it('reorderEntities atomically rewrites display_order in the given order', () => {
    insertCar('car-a', 1);
    insertCar('car-b', 2);
    insertCar('car-c', 3);

    reorderEntities(db, 'cars', ['car-c', 'car-a', 'car-b']);

    const rows = db
      .prepare('SELECT id, display_order FROM cars ORDER BY display_order ASC')
      .all() as Array<{ id: string; display_order: number }>;
    expect(rows.map((r) => r.id)).toEqual(['car-c', 'car-a', 'car-b']);
    expect(rows.map((r) => r.display_order)).toEqual([0, 1, 2]);
  });

  it('getPublicData returns cars sorted by display_order then id', () => {
    insertCar('car-z', 3);
    insertCar('car-a', 1);
    insertCar('car-m', 2);

    const data = getPublicData(db);
    expect(data.cars.map((c) => c.id)).toEqual(['car-a', 'car-m', 'car-z']);
  });

  it('reorderEntities throws and rolls back on an unknown id', () => {
    insertCar('car-a', 1);
    insertCar('car-b', 2);

    expect(() => reorderEntities(db, 'cars', ['car-a', 'nope'])).toThrow(
      /does not exist/,
    );

    // The transaction must have rolled back — display_order unchanged.
    const rows = db
      .prepare('SELECT id, display_order FROM cars ORDER BY display_order ASC')
      .all() as Array<{ id: string; display_order: number }>;
    expect(rows.map((r) => r.id)).toEqual(['car-a', 'car-b']);
    expect(rows.map((r) => r.display_order)).toEqual([1, 2]);
  });

  it('reorderEntities throws and rolls back on duplicate ids', () => {
    insertCar('car-a', 1);
    insertCar('car-b', 2);

    expect(() => reorderEntities(db, 'cars', ['car-a', 'car-a', 'car-b'])).toThrow(
      /duplicate/,
    );

    // The transaction must have rolled back — display_order unchanged.
    const rows = db
      .prepare('SELECT id, display_order FROM cars ORDER BY display_order ASC')
      .all() as Array<{ id: string; display_order: number }>;
    expect(rows.map((r) => r.id)).toEqual(['car-a', 'car-b']);
    expect(rows.map((r) => r.display_order)).toEqual([1, 2]);
  });
});
