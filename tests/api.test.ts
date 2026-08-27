process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import { publicApi } from '../server/routes/public.js';

describe('public API', () => {
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

  it('GET /data returns correctly-shaped public data reflecting inserted rows', async () => {
    // Seed a single car and a single faq directly via parameterized SQL.
    db.prepare(
      `INSERT INTO cars (id, name, nameAr, category, categoryAr, description, seo_description, passengers, images, image_alts, features)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'car-1',
      'Test Car',
      'تست',
      'sedan',
      'سيدان',
      'desc',
      null,
      4,
      '["a"]',
      '[]',
      '["x"]',
    );
    db.prepare('INSERT INTO faqs (id, question, answer) VALUES (?, ?, ?)').run(
      'faq-1',
      'Q?',
      'A.',
    );

    const res = await publicApi.request('/data');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.cars)).toBe(true);
    expect(Array.isArray(body.faqs)).toBe(true);
    expect(typeof body.contactInfo).toBe('object');
    expect(body.contactInfo).not.toBeNull();
    expect(typeof body.routeData).toBe('object');
    expect(body.routeData).not.toBeNull();
    expect(Array.isArray(body.services)).toBe(true);

    // The response must reflect the inserted rows.
    expect((body.cars as unknown[]).length).toBe(1);
    expect((body.faqs as unknown[]).length).toBe(1);
  });

  it('GET /pricing returns correctly-shaped pricing data reflecting inserted config', async () => {
    const insert = db.prepare(
      'INSERT INTO pricing_config (key, value) VALUES (?, ?)',
    );
    insert.run('currency', 'EGP');
    insert.run('currencyAr', 'جنيه');
    insert.run('whatsappNumber', '201005656117');
    insert.run('contactEmail', 'booking@wasalny.com');

    const res = await publicApi.request('/pricing');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.locations)).toBe(true);
    expect(Array.isArray(body.routeGroups)).toBe(true);
    expect(Array.isArray(body.vehiclePricing)).toBe(true);
    expect(typeof body.pricingConfig).toBe('object');
    expect(body.pricingConfig).not.toBeNull();

    const config = body.pricingConfig as Record<string, unknown>;
    expect(config.currency).toBe('EGP');
    expect(config.currencyAr).toBe('جنيه');
    expect(config.whatsappNumber).toBe('201005656117');
    expect(config.contactEmail).toBe('booking@wasalny.com');
  });
});
