process.env.NODE_ENV = 'test';

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('ordering guard — prevents regression of display_order bugs', () => {
  it('seed INSERTs all contain display_order (5 tables)', () => {
    const seed = readFileSync(resolve('server/db/seed.ts'), 'utf8');
    const hits = (seed.match(/display_order/g) || []).length;
    expect(hits).toBe(5);
    expect(seed).toMatch(/INSERT INTO locations.*display_order/);
    expect(seed).toMatch(/INSERT INTO route_groups.*display_order/);
    expect(seed).toMatch(/INSERT INTO faqs.*display_order/);
    expect(seed).toMatch(/INSERT INTO route_data.*display_order/);
    expect(seed).toMatch(/INSERT INTO cars.*display_order/);
  });

  it('all 5 admin doReorder map displayOrder to index', () => {
    const files = [
      'src/admin/FaqAdmin.tsx',
      'src/admin/LocationAdmin.tsx',
      'src/admin/RouteGroupAdmin.tsx',
      'src/admin/RouteDataAdmin.tsx',
      'src/admin/CarAdmin.tsx',
    ];
    for (const file of files) {
      const content = readFileSync(resolve(file), 'utf8');
      expect(content, `${file} must contain displayOrder: i mapping`).toMatch(/displayOrder:\s*i/);
      expect(content, `${file} must use nextWithOrder`).toMatch(/nextWithOrder/);
    }
  });

  it('migration backfill exists and is idempotent WHERE display_order=0', () => {
    const sql = readFileSync(resolve('server/db/migrations/0004_backfill_display_order.sql'), 'utf8');
    expect(sql).toMatch(/UPDATE cars.*WHERE display_order = 0/);
    expect(sql).toMatch(/UPDATE locations.*WHERE display_order = 0/);
    expect(sql).toMatch(/UPDATE faqs.*WHERE display_order = 0/);
    expect(sql).toMatch(/UPDATE route_groups.*WHERE display_order = 0/);
    expect(sql).toMatch(/UPDATE route_data.*WHERE display_order = 0/);
  });

  it('Car create form has no الفئة (عربي) free-text field', () => {
    const admin = readFileSync(resolve('src/admin/CarAdmin.tsx'), 'utf8');
    expect(admin).not.toMatch(/Field label="الفئة \(عربي\)"/);
    expect(admin).toMatch(/CATEGORY_LABELS\[/);
    expect(admin).toMatch(/CAR_CATEGORIES.*map/);
  });

  it('carHelpers exports CATEGORY_LABELS for 5 categories', async () => {
    const { CATEGORY_LABELS, CAR_CATEGORIES } = await import('../src/admin/carHelpers');
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual([...CAR_CATEGORIES].sort());
    expect(CATEGORY_LABELS.sedan).toBe('سيدان');
  });
});
