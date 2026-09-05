/* eslint-disable @typescript-eslint/no-explicit-any */
process.env.NODE_ENV = 'test';
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { migrate } from '../server/db/migrate.js';
import { seed } from '../server/db/seed.js';
import { getPublicData, createCar } from '../server/db/queries.js';
import { CAR_CATEGORIES, CATEGORY_LABELS } from '../src/admin/carHelpers';

function freshDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  seed(db);
  return db;
}

describe('S-CAR flat-5 integration', () => {
  it('grouped is exactly 5 flat groups, no nested category', () => {
    const db = freshDb();
    const { cars } = getPublicData(db);
    const grouped = CAR_CATEGORIES.map((cat) => ({
      category: cat,
      cars: cars.filter((c) => c.category === cat),
    }));
    expect(grouped.length).toBe(5);
    for (const g of grouped) {
      expect(CAR_CATEGORIES).toContain(g.category);
    }
    expect(CATEGORY_LABELS.sedan).toBe('سيدان');
  });

  it('new car appears directly under its category header', () => {
    const db = freshDb();
    const before = getPublicData(db).cars;
    const beforeSedan = before.filter((c) => c.category === 'sedan').length;
    createCar(db, {
      nameAr: 'سيارة اختبار',
      category: 'sedan',
      categoryAr: CATEGORY_LABELS.sedan,
      description: 'desc',
      images: ['img.jpg'],
      features: ['feat'],
      displayOrder: 0,
    } as any);
    const after = getPublicData(db).cars;
    const grouped = CAR_CATEGORIES.map((cat) => ({
      category: cat,
      cars: after.filter((c) => c.category === cat),
    }));
    const sedanGroup = grouped.find((g) => g.category === 'sedan')!;
    expect(sedanGroup.cars.length).toBe(beforeSedan + 1);
    expect(sedanGroup.cars.some((c) => c.nameAr === 'سيارة اختبار')).toBe(true);
    const otherGroups = grouped.filter((g) => g.category !== 'sedan');
    for (const g of otherGroups) {
      expect(g.cars.some((c) => c.nameAr === 'سيارة اختبار')).toBe(false);
    }
  });

  it('no 6th group appears after create', () => {
    const db = freshDb();
    createCar(db, {
      nameAr: 'اخرى',
      category: 'suv',
      categoryAr: CATEGORY_LABELS.suv,
      description: 'x',
      images: [],
      features: [],
      displayOrder: 0,
    } as any);
    const { cars } = getPublicData(db);
    const uniqueCats = [...new Set(cars.map((c) => c.category))].sort();
    expect(uniqueCats.sort()).toEqual([...CAR_CATEGORIES].sort());
  });
});
