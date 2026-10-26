import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import { app } from '../server/app.js';

describe('composed server app', () => {
  let h: D1Harness;

  beforeAll(async () => {
    h = await createHarness();
    await h.applyMigrations();
  });

  afterAll(async () => {
    await h.dispose();
  });

  beforeEach(async () => {
    // The harness database is per-file, so reset every table before each case
    // to keep fixtures isolated.
    await h.resetTables();
  });

  it('GET /api/data returns public data with a cars array', async () => {
    // Insert a car so the assertion is meaningful.
    await h.db
      .prepare(
        `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
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
      )
      .run();

    const res = await app.request('/api/data', {}, h.env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.cars)).toBe(true);
    expect((body.cars as unknown[]).length).toBe(1);
  });

  it('GET /api/pricing returns pricing data with a pricingConfig object', async () => {
    await h.db
      .prepare('INSERT INTO pricing_config (key, value) VALUES (?, ?)')
      .bind('currency', 'EGP')
      .run();

    const res = await app.request('/api/pricing', {}, h.env);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body.pricingConfig).toBe('object');
    expect(body.pricingConfig).not.toBeNull();
  });

  it('POST /api/admin/login returns 401 when no admin exists', async () => {
    // Proves adminAuth is mounted under /api/admin.
    const res = await app.request(
      '/api/admin/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'x', password: 'y' }),
      },
      h.env,
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/cars returns 404 (not a public route)', async () => {
    // /api/cars is not a public route; adminCrud lives at /api/admin/cars.
    const res = await app.request('/api/cars', {}, h.env);
    expect(res.status).toBe(404);
  });
});
