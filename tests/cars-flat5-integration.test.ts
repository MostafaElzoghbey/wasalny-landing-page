import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import { getPublicData, createCar } from '../server/db/queries.js';
import { CAR_CATEGORIES, CATEGORY_LABELS } from '../src/admin/carHelpers';

describe('S-CAR flat-5 integration', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
    await h.applySeed();
  });

  afterAll(async () => {
    await h.dispose();
  });

  it('grouped is exactly 5 flat groups, no nested category', async () => {
    const { cars } = await getPublicData(h.db);
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

  it('new car appears directly under its category header', async () => {
    const before = (await getPublicData(h.db)).cars;
    const beforeSedan = before.filter((c) => c.category === 'sedan').length;
    await createCar(h.db, {
      nameAr: 'سيارة اختبار',
      category: 'sedan',
      categoryAr: CATEGORY_LABELS.sedan,
      description: 'desc',
      images: ['img.jpg'],
      features: ['feat'],
      displayOrder: 0,
    });
    const after = (await getPublicData(h.db)).cars;
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

  it('no 6th group appears after create', async () => {
    await createCar(h.db, {
      nameAr: 'اخرى',
      category: 'suv',
      categoryAr: CATEGORY_LABELS.suv,
      description: 'x',
      images: [],
      features: [],
      displayOrder: 0,
    });
    const { cars } = await getPublicData(h.db);
    const uniqueCats = [...new Set(cars.map((c) => c.category))].sort();
    expect(uniqueCats.sort()).toEqual([...CAR_CATEGORIES].sort());
  });
});
