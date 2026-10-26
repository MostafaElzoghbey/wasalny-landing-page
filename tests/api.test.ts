import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import { publicApi } from '../server/routes/public.js';

describe('public API', () => {
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

  it('GET /data returns correctly-shaped public data reflecting inserted rows', async () => {
    // Seed a single car and a single faq directly via parameterized SQL.
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
    await h.db
      .prepare('INSERT INTO faqs (id, question, answer) VALUES (?, ?, ?)')
      .bind('faq-1', 'Q?', 'A.')
      .run();

    const res = await publicApi.request('/data', {}, h.env);
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
    const insertRoute = (
      id: string,
      title: string,
      description: string,
      metaTitle: string,
      metaDescription: string,
      heroImage: string,
      priceStart: string,
      distance: string,
      duration: string,
      displayOrder: number,
      fromLabel: string,
      toLabel: string,
    ) =>
      h.db
        .prepare(
          `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs, display_order, fromLabel, toLabel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          title,
          description,
          metaTitle,
          metaDescription,
          heroImage,
          priceStart,
          distance,
          duration,
          '[]',
          '[]',
          displayOrder,
          fromLabel,
          toLabel,
        )
        .run();
    await insertRoute(
      'r-late',
      'رحلة متأخرة',
      'وصف متأخر',
      'ميتا متأخر',
      'وصف ميتا متأخر',
      'data:image/png;base64,QUFB',
      '300',
      '220 كم',
      '3 ساعات',
      1,
      'القاهرة',
      'دمياط',
    );
    await insertRoute(
      'r-early',
      'رحلة مبكرة',
      'وصف مبكر',
      'ميتا مبكر',
      'وصف ميتا مبكر',
      'data:image/png;base64,QkJC',
      '150',
      '200 كم',
      '2.5 ساعات',
      0,
      'دمياط',
      'القاهرة',
    );

    // When: the public payload is fetched.
    const res = await publicApi.request('/data', {}, h.env);
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
    await h.db
      .prepare('INSERT INTO pricing_config (key, value) VALUES (?, ?)')
      .bind('whatsappNumber', '201005656117')
      .run();

    const res = await publicApi.request('/pricing', {}, h.env);
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
