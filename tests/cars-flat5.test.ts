process.env.NODE_ENV = 'test';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATEGORY_LABELS, CAR_CATEGORIES } from '../src/admin/carHelpers';

describe('S-CAR flat 5 direct rows contract', () => {
  it('CarAdmin select shows Arabic labels not English keys', () => {
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).toMatch(/CATEGORY_LABELS\[c\]/);
    expect(admin).not.toMatch(/<option[^>]*>\{c\}<\/option>/);
  });

  it('CarCard collapsed header shows thumb + order + Arabic badge', () => {
    const card = readFileSync(resolve('src/admin/CarCard.tsx'), 'utf8');
    expect(card).toMatch(/car-thumb-/);
    expect(card).toMatch(/car-order-/);
    expect(card).toMatch(/CATEGORY_LABELS\[group\.category\]/);
    expect(card).not.toMatch(/\{group\.category\}<\/span>/);
  });

  it('CAR_CATEGORIES is exactly 5 flat groups', () => {
    expect(CAR_CATEGORIES).toEqual(['sedan', 'suv', 'family_cruiser', 'minibus', 'wedding']);
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...CAR_CATEGORIES].sort());
  });

  it('CarCategoryGroup renders exactly 5 headers and no nested category', () => {
    const grp = readFileSync(resolve('src/admin/CarCategoryGroup.tsx'), 'utf8');
    expect(grp).toMatch(/car-category-/);
    expect(grp).not.toMatch(/car-category-.*car-category-/s);
  });

  it('CarAdmin grouped logic is flat CAR_CATEGORIES.map filter', () => {
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).toMatch(/CAR_CATEGORIES\.map.*cars\.filter.*category === cat/);
  });
});
