import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import {
  createCar,
  getPublicData,
  reorderEntities,
} from '../server/db/queries.js';

describe('queries ordering', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
  });

  afterAll(async () => {
    await h.dispose();
  });

  beforeEach(async () => {
    await h.resetTables();
  });

  async function insertCar(id: string, displayOrder: number) {
    await h.db
      .prepare(
        `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
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
      )
      .run();
  }

  async function orderedCars(): Promise<Array<{ id: string; display_order: number }>> {
    const { results } = await h.db
      .prepare('SELECT id, display_order FROM cars ORDER BY display_order ASC')
      .all<{ id: string; display_order: number }>();
    return results;
  }

  it('createCar auto-assigns displayOrder = max + 1', async () => {
    await insertCar('car-1', 1);
    await insertCar('car-2', 2);

    const created = await createCar(h.db, {
      nameAr: 'سيدان',
      category: 'sedan',
      categoryAr: 'سيدان',
      description: 'desc',
      images: [],
      features: [],
    });

    expect(created.displayOrder).toBe(3);
  });

  it('createCar preserves explicit displayOrder 0', async () => {
    await insertCar('car-1', 1);
    await insertCar('car-2', 2);

    const created = await createCar(h.db, {
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

  it('reorderEntities atomically rewrites display_order in the given order', async () => {
    await insertCar('car-a', 1);
    await insertCar('car-b', 2);
    await insertCar('car-c', 3);

    await reorderEntities(h.db, 'cars', ['car-c', 'car-a', 'car-b']);

    const rows = await orderedCars();
    expect(rows.map((r) => r.id)).toEqual(['car-c', 'car-a', 'car-b']);
    expect(rows.map((r) => r.display_order)).toEqual([0, 1, 2]);
  });

  it('getPublicData returns cars sorted by display_order then id', async () => {
    await insertCar('car-z', 3);
    await insertCar('car-a', 1);
    await insertCar('car-m', 2);

    const data = await getPublicData(h.db);
    expect(data.cars.map((c) => c.id)).toEqual(['car-a', 'car-m', 'car-z']);
  });

  it('reorderEntities throws and rolls back on an unknown id', async () => {
    await insertCar('car-a', 1);
    await insertCar('car-b', 2);

    await expect(reorderEntities(h.db, 'cars', ['car-a', 'nope'])).rejects.toThrow(
      /does not exist/,
    );

    // The transaction must have rolled back — display_order unchanged.
    const rows = await orderedCars();
    expect(rows.map((r) => r.id)).toEqual(['car-a', 'car-b']);
    expect(rows.map((r) => r.display_order)).toEqual([1, 2]);
  });

  it('reorderEntities throws and rolls back on duplicate ids', async () => {
    await insertCar('car-a', 1);
    await insertCar('car-b', 2);

    await expect(
      reorderEntities(h.db, 'cars', ['car-a', 'car-a', 'car-b']),
    ).rejects.toThrow(/duplicate/);

    // The transaction must have rolled back — display_order unchanged.
    const rows = await orderedCars();
    expect(rows.map((r) => r.id)).toEqual(['car-a', 'car-b']);
    expect(rows.map((r) => r.display_order)).toEqual([1, 2]);
  });
});
