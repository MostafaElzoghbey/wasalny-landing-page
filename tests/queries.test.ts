process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import {
  getPublicData,
  getPricingData,
  createCar,
  createFaq,
  getFaqs,
} from '../server/db/queries.js';

describe('queries', () => {
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

  it('getPublicData returns parsed car rows from the cars table', () => {
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

    const data = getPublicData(db);

    expect(data.cars).toHaveLength(1);
    expect(data.cars[0].images).toEqual(['a']);
    expect(data.cars[0].imageAlts).toEqual([]);
    expect(data.cars[0].seoDescription).toBeUndefined();
  });

  it('getPricingData returns a shaped pricingConfig after inserting pricing_config rows', () => {
    const insert = db.prepare(
      'INSERT INTO pricing_config (key, value) VALUES (?, ?)',
    );
    insert.run('whatsappNumber', '201005656117');

    const data = getPricingData(db);

    expect(data.pricingConfig).toEqual({
      whatsappNumber: '201005656117',
    });
  });

  it('getPricingData pricingConfig contains only whatsappNumber key', () => {
    const insert = db.prepare(
      'INSERT INTO pricing_config (key, value) VALUES (?, ?)',
    );
    insert.run('whatsappNumber', '201005656117');
    insert.run('currency', 'EGP');
    insert.run('currencyAr', 'جنيه');
    insert.run('contactEmail', 'booking@wasalny.com');

    const data = getPricingData(db);

    expect(data.pricingConfig).toEqual({
      whatsappNumber: '201005656117',
    });
    expect(Object.keys(data.pricingConfig)).toEqual(['whatsappNumber']);
  });

  it('createCar then getPublicData round-trips a car with parsed JSON columns', () => {
    const created = createCar(db, {
      nameAr: 'سيدان',
      category: 'sedan',
      categoryAr: 'سيدان',
      description: 'desc',
      images: ['a', 'b'],
      imageAlts: ['alt-a'],
      features: ['x'],
    });
    expect(created.id).toBeTypeOf('string');

    const data = getPublicData(db);
    expect(data.cars).toHaveLength(1);
    expect(data.cars[0].images).toEqual(['a', 'b']);
    expect(data.cars[0].imageAlts).toEqual(['alt-a']);
    expect(data.cars[0].seoDescription).toBeUndefined();
  });

  it('createFaq then getFaqs round-trips a faq', () => {
    const created = createFaq(db, { question: 'Q?', answer: 'A.' });
    expect(created.id).toBeTypeOf('string');

    const faqs = getFaqs(db);
    expect(faqs).toHaveLength(1);
    expect(faqs[0]).toEqual({ id: created.id, question: 'Q?', answer: 'A.', displayOrder: expect.any(Number) });
  });
});
