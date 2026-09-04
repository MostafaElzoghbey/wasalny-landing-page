process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { app } from '../server/app.js';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';

describe('composed server app', () => {
  let db: Database.Database;

  beforeAll(() => {
    // Force an in-memory database so the test never touches data/app.db.
    process.env.NODE_ENV = 'test';
    db = getDb();
    migrate(db);
  });

  beforeEach(() => {
    // The in-memory database is a singleton shared across tests in this file,
    // so reset every table before each case to keep fixtures isolated.
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

  it('GET /api/data returns public data with a cars array', async () => {
    // Insert a car so the assertion is meaningful.
    db.prepare(
      `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'car-1',
      'تست',
      'sedan',
      'سيدان',
      'desc',
      null,
      '["a"]',
      '[]',
      '["x"]',
      1,
    );

    const res = await app.request('/api/data');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.cars)).toBe(true);
    expect((body.cars as unknown[]).length).toBe(1);
  });

  it('GET /api/pricing returns pricing data with a pricingConfig object', async () => {
    db.prepare('INSERT INTO pricing_config (key, value) VALUES (?, ?)').run(
      'currency',
      'EGP',
    );

    const res = await app.request('/api/pricing');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.pricingConfig).toBe('object');
    expect(body.pricingConfig).not.toBeNull();
  });

  it('POST /api/admin/login returns 401 when no admin exists', async () => {
    // Proves adminAuth is mounted under /api/admin.
    const res = await app.request('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'x', password: 'y' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/cars returns 404 (not a public route)', async () => {
    // /api/cars is not a public route; adminCrud lives at /api/admin/cars.
    const res = await app.request('/api/cars');
    expect(res.status).toBe(404);
  });
});
