import { describe, it, expect, beforeAll } from 'vitest';
import Database from 'better-sqlite3';
import { seed } from '../server/db/seed.js';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import { locations, routeGroups, vehiclePricing, pricingConfig } from '../src/data/pricing';
import { cars, carCategories, carImages, mockupImages, logoImage } from '../src/data/cars';
import { contactInfo, routes, stats, services, features } from '../src/data/content';
import { faqs } from '../src/data/faqs';
import { routeData } from '../src/data/routeData';

beforeAll(() => {
  // Force an in-memory database so the test never touches data/app.db.
  process.env.NODE_ENV = 'test';
});

const count = (db: Database.Database, table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

describe('seed', () => {
  it('inserts all source data into the database with counts matching the source arrays', () => {
    const db = getDb();
    migrate(db);
    seed(db);

    expect(count(db, 'locations')).toBe(locations.length);
    expect(count(db, 'cars')).toBe(cars.length);
    expect(count(db, 'faqs')).toBe(faqs.length);
    expect(count(db, 'route_data')).toBe(Object.keys(routeData).length);
    expect(count(db, 'route_groups')).toBe(routeGroups.length);

    const expectedRoutePricing = routeGroups.reduce(
      (sum, rg) => sum + Object.keys(rg.pricing).length,
      0,
    );
    expect(count(db, 'route_pricing')).toBe(expectedRoutePricing);
    expect(count(db, 'vehicle_pricing')).toBe(vehiclePricing.length);
    expect(count(db, 'pricing_config')).toBe(1);
    expect(count(db, 'content')).toBe(9);

    // Sanity: the 9 content keys are exactly the ones enumerated in the task.
    const contentKeys = (
      db.prepare('SELECT key FROM content').all() as Array<{ key: string }>
    ).map((r) => r.key);
    expect(contentKeys.sort()).toEqual(
      [
        'carCategories',
        'carImages',
        'contactInfo',
        'features',
        'logoImage',
        'mockupImages',
        'routes',
        'services',
        'stats',
      ].sort(),
    );

    // Touch the imported values so the assertions stay coupled to the source.
    expect(pricingConfig.whatsappNumber).toBeTypeOf('string');
    expect(carCategories.length).toBeGreaterThan(0);
    expect(carImages).toBeTypeOf('object');
    expect(mockupImages).toBeTypeOf('object');
    expect(logoImage).toBeTypeOf('string');
    expect(contactInfo).toBeTypeOf('object');
    expect(routes).toBeTypeOf('object');
    expect(stats).toBeTypeOf('object');
    expect(services).toBeTypeOf('object');
    expect(features).toBeTypeOf('object');
  });

  it('is idempotent: seeding the same database twice does not duplicate rows', () => {
    // Use a fresh in-memory database so this test exercises the real
    // double-insert path (seed -> seed) rather than relying on the singleton
    // already being populated by the previous test.
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    migrate(db);

    seed(db);
    const before = count(db, 'cars');
    seed(db);
    const after = count(db, 'cars');

    expect(after).toBe(before);
    // And every other table is also unchanged on the second run.
    expect(count(db, 'locations')).toBe(locations.length);
    expect(count(db, 'route_pricing')).toBe(
      routeGroups.reduce((sum, rg) => sum + Object.keys(rg.pricing).length, 0),
    );
  });
});
