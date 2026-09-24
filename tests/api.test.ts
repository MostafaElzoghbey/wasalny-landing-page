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

  it('GET /data exposes recovered routeData fields and a routes array derived from route_data', async () => {
    // Given: two route_data rows with distinct display_order and Arabic labels.
    db.prepare(
      `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs, display_order, fromLabel, toLabel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'r-late',
      'رحلة متأخرة',
      'وصف متأخر',
      'ميتا متأخر',
      'وصف ميتا متأخر',
      'data:image/png;base64,QUFB',
      '300',
      '220 كم',
      '3 ساعات',
      '[]',
      '[]',
      1,
      'القاهرة',
      'دمياط',
    );
    db.prepare(
      `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs, display_order, fromLabel, toLabel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'r-early',
      'رحلة مبكرة',
      'وصف مبكر',
      'ميتا مبكر',
      'وصف ميتا مبكر',
      'data:image/png;base64,QkJC',
      '150',
      '200 كم',
      '2.5 ساعات',
      '[]',
      '[]',
      0,
      'دمياط',
      'القاهرة',
    );

    // When: the public payload is fetched.
    const res = await publicApi.request('/data');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      routeData: Record<string, Record<string, unknown>>;
      routes: Array<Record<string, unknown>>;
    };

    // Then: routeData entries carry the recovered fields populated from the row.
    expect(body.routeData['r-early']).toMatchObject({
      metaTitle: 'ميتا مبكر',
      metaDescription: 'وصف ميتا مبكر',
      heroImage: 'data:image/png;base64,QkJC',
      priceStart: '150',
      fromLabel: 'دمياط',
      toLabel: 'القاهرة',
    });

    // And: routes is derived from route_data with exactly the public Route
    // shape, ordered by display_order ASC then id ASC (higher order sorts last).
    expect(body.routes).toEqual([
      { id: 'r-early', from: 'دمياط', to: 'القاهرة', duration: '2.5 ساعات', description: 'وصف مبكر' },
      { id: 'r-late', from: 'القاهرة', to: 'دمياط', duration: '3 ساعات', description: 'وصف متأخر' },
    ]);
  });

  it('GET /pricing returns correctly-shaped pricing data with only whatsappNumber in pricingConfig', async () => {
    const insert = db.prepare(
      'INSERT INTO pricing_config (key, value) VALUES (?, ?)',
    );
    insert.run('whatsappNumber', '201005656117');

    const res = await publicApi.request('/pricing');
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body.locations)).toBe(true);
    expect(Array.isArray(body.routeGroups)).toBe(true);
    expect(Array.isArray(body.vehiclePricing)).toBe(true);
    expect(typeof body.pricingConfig).toBe('object');
    expect(body.pricingConfig).not.toBeNull();

    const config = body.pricingConfig as Record<string, unknown>;
    expect(config.whatsappNumber).toBe('201005656117');
    expect(Object.keys(config)).toEqual(['whatsappNumber']);
  });
});
