import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createHarness, type D1Harness } from './helpers/d1.js';
import {
  getPublicData,
  getPricingData,
  createCar,
  createFaq,
  getFaqs,
  deriveRoutes,
} from '../server/db/queries.js';

describe('queries', () => {
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

  it('getPublicData returns parsed car rows from the cars table', async () => {
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

    const data = await getPublicData(h.db);

    expect(data.cars).toHaveLength(1);
    expect(data.cars[0].images).toEqual(['a']);
    expect(data.cars[0].imageAlts).toEqual([]);
    expect(data.cars[0].seoDescription).toBeUndefined();
  });

  it('getPricingData returns a shaped pricingConfig after inserting pricing_config rows', async () => {
    await h.db
      .prepare('INSERT INTO pricing_config (key, value) VALUES (?, ?)')
      .bind('whatsappNumber', '201005656117')
      .run();

    const data = await getPricingData(h.db);

    expect(data.pricingConfig).toEqual({
      whatsappNumber: '201005656117',
    });
  });

  it('getPricingData pricingConfig contains only whatsappNumber key', async () => {
    const insert = (key: string, value: string) =>
      h.db.prepare('INSERT INTO pricing_config (key, value) VALUES (?, ?)').bind(key, value).run();
    await insert('whatsappNumber', '201005656117');
    await insert('currency', 'EGP');
    await insert('currencyAr', 'جنيه');
    await insert('contactEmail', 'booking@wasalny.com');

    const data = await getPricingData(h.db);

    expect(data.pricingConfig).toEqual({
      whatsappNumber: '201005656117',
    });
    expect(Object.keys(data.pricingConfig)).toEqual(['whatsappNumber']);
  });

  it('createCar then getPublicData round-trips a car with parsed JSON columns', async () => {
    const created = await createCar(h.db, {
      nameAr: 'سيدان',
      category: 'sedan',
      categoryAr: 'سيدان',
      description: 'desc',
      images: ['a', 'b'],
      imageAlts: ['alt-a'],
      features: ['x'],
    });
    expect(created.id).toBeTypeOf('string');

    const data = await getPublicData(h.db);
    expect(data.cars).toHaveLength(1);
    expect(data.cars[0].images).toEqual(['a', 'b']);
    expect(data.cars[0].imageAlts).toEqual(['alt-a']);
    expect(data.cars[0].seoDescription).toBeUndefined();
  });

  it('createFaq then getFaqs round-trips a faq', async () => {
    const created = await createFaq(h.db, { question: 'Q?', answer: 'A.' });
    expect(created.id).toBeTypeOf('string');

    const faqs = await getFaqs(h.db);
    expect(faqs).toHaveLength(1);
    expect(faqs[0]).toEqual({ id: created.id, question: 'Q?', answer: 'A.', displayOrder: expect.any(Number) });
  });

  it('deriveRoutes maps route_data entries to the public Route shape', () => {
    const routes = deriveRoutes([
      {
        id: 'r1',
        fromLabel: 'دمياط',
        toLabel: 'القاهرة',
        title: 't',
        description: 'd',
        metaTitle: 'mt',
        metaDescription: 'md',
        heroImage: 'h',
        priceStart: 'p',
        distance: 'dist',
        duration: 'dur',
        features: [],
        faqs: [],
        displayOrder: 0,
      },
    ]);
    expect(routes).toEqual([
      { id: 'r1', from: 'دمياط', to: 'القاهرة', duration: 'dur', description: 'd' },
    ]);
  });

  it('getPublicData derives routes from route_data rows in display_order ASC, id ASC order', async () => {
    const insertRoute = (
      id: string,
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
          't',
          'd',
          'mt',
          'md',
          'h',
          'p',
          'dist',
          'dur',
          '[]',
          '[]',
          displayOrder,
          fromLabel,
          toLabel,
        )
        .run();
    await insertRoute('r-b', 1, 'القاهرة', 'دمياط');
    await insertRoute('r-a', 0, 'دمياط', 'القاهرة');

    const data = await getPublicData(h.db);
    expect(data.routes).toEqual([
      { id: 'r-a', from: 'دمياط', to: 'القاهرة', duration: 'dur', description: 'd' },
      { id: 'r-b', from: 'القاهرة', to: 'دمياط', duration: 'dur', description: 'd' },
    ]);
  });
});
