import type Database from 'better-sqlite3';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { getDb } from './connection.js';
import { migrate } from './migrate.js';
import { locations, routeGroups, vehiclePricing, pricingConfig } from '../../src/data/pricing';
import { cars, carCategories, carImages, mockupImages, logoImage } from '../../src/data/cars';
import { contactInfo, routes, stats, services, features } from '../../src/data/content';
import { faqs } from '../../src/data/faqs';
import { routeData } from '../../src/data/routeData';

/**
 * Idempotently imports the static site content from the TS data modules into
 * the SQLite tables created by `migrate`.
 *
 * Safe to call any number of times: if the `cars` table already has rows the
 * whole function returns early (the seed is an all-or-nothing transaction, so
 * any row in `cars` implies the full seed already ran). Existing rows are never
 * deleted or overwritten.
 */
export function seed(db: Database.Database = getDb()): void {
  const row = db.prepare('SELECT COUNT(*) AS c FROM cars').get() as { c: number };
  if (row.c > 0) {
    return;
  }

  const run = db.transaction(() => {
    const insLocation = db.prepare(
      'INSERT INTO locations (id, name, nameAr, type) VALUES (?, ?, ?, ?)',
    );
    for (const l of locations) {
      insLocation.run(l.id, l.name, l.nameAr, l.type);
    }

    const insRouteGroup = db.prepare(
      'INSERT INTO route_groups (id, type, nameAr, bidirectional, from_locations, to_locations) VALUES (?, ?, ?, ?, ?, ?)',
    );
    for (const rg of routeGroups) {
      insRouteGroup.run(
        rg.id,
        rg.type,
        rg.nameAr,
        rg.bidirectional ? 1 : 0,
        JSON.stringify(rg.fromLocations),
        JSON.stringify(rg.toLocations),
      );
    }

    const insRoutePricing = db.prepare(
      'INSERT INTO route_pricing (route_group_id, vehicle_category, one_way, round_trip) VALUES (?, ?, ?, ?)',
    );
    for (const rg of routeGroups) {
      for (const [category, price] of Object.entries(rg.pricing)) {
        insRoutePricing.run(rg.id, category, price.oneWay, price.roundTrip);
      }
    }

    const insVehiclePricing = db.prepare(
      'INSERT INTO vehicle_pricing (category, categoryAr, max_passengers, min_passengers) VALUES (?, ?, ?, ?)',
    );
    for (const v of vehiclePricing) {
      insVehiclePricing.run(v.category, v.categoryAr, v.maxPassengers, v.minPassengers);
    }

    const insPricingConfig = db.prepare(
      'INSERT INTO pricing_config (key, value) VALUES (?, ?)',
    );
    for (const [key, value] of Object.entries(pricingConfig)) {
      insPricingConfig.run(key, String(value));
    }

    const insCar = db.prepare(
      'INSERT INTO cars (id, name, nameAr, category, categoryAr, description, seo_description, passengers, images, image_alts, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const c of cars) {
      insCar.run(
        c.id,
        c.name,
        c.nameAr,
        c.category,
        c.categoryAr,
        c.description,
        c.seoDescription ?? null,
        c.passengers,
        JSON.stringify(c.images),
        JSON.stringify(c.imageAlts ?? []),
        JSON.stringify(c.features),
      );
    }

    const insContent = db.prepare('INSERT INTO content (key, value) VALUES (?, ?)');
    insContent.run('contactInfo', JSON.stringify(contactInfo));
    insContent.run('routes', JSON.stringify(routes));
    insContent.run('stats', JSON.stringify(stats));
    insContent.run('services', JSON.stringify(services));
    insContent.run('features', JSON.stringify(features));
    insContent.run('logoImage', JSON.stringify(logoImage));
    insContent.run('carImages', JSON.stringify(carImages));
    insContent.run('mockupImages', JSON.stringify(mockupImages));
    insContent.run('carCategories', JSON.stringify(carCategories));

    const insFaq = db.prepare('INSERT INTO faqs (id, question, answer) VALUES (?, ?, ?)');
    faqs.forEach((f, i) => {
      insFaq.run(`faq-${i + 1}`, f.question, f.answer);
    });

    const insRouteData = db.prepare(
      'INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const [id, rd] of Object.entries(routeData)) {
      insRouteData.run(
        id,
        rd.title,
        rd.description,
        rd.metaTitle,
        rd.metaDescription,
        rd.heroImage,
        rd.priceStart,
        rd.distance,
        rd.duration,
        JSON.stringify(rd.features),
        JSON.stringify(rd.faqs),
      );
    }
  });

  run();
}

// Run directly via `npm run db:seed` / `tsx server/db/seed.ts`, but never as a
// side effect of being imported (e.g. by the test suite).
const isExecutedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  migrate();
  seed();
  process.stdout.write('Seed complete.\n');
  process.exit(0);
}
