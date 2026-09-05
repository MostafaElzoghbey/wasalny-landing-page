process.env.NODE_ENV = 'test';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATEGORY_LABELS, CAR_CATEGORIES } from '../src/admin/carHelpers';

describe('S-CAR flat 5 direct rows contract', () => {
  it('CarAdmin select shows Arabic labels not English keys', () => {
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).toMatch(/CATEGORY_LABELS\[/);
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

  it('CarCategoryGroup is deleted — flat fleet mode (no subgroups)', () => {
    let exists = true;
    try {
      readFileSync(resolve('src/admin/CarCategoryGroup.tsx'), 'utf8');
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).not.toMatch(/CarCategoryGroup/);
    expect(admin).not.toMatch(/expandedCategories/);
  });

  it('CarAdmin drill-down uses big-category grid with per-category filter and global flatMap reorder', () => {
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).toMatch(/category-grid/);
    expect(admin).toMatch(/category-drilldown/);
    expect(admin).toMatch(/CAR_CATEGORIES.*flatMap/);
    expect(admin).toMatch(/useReorderAnimation/);
    expect(admin).toMatch(/data-reorder-item/);
    expect(admin).toMatch(/transitionDelay/);
  });
});
