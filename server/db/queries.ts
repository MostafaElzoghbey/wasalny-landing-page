// server/db/queries.ts
// Typed read/write query layer for the Wasalny data-access API.
//
// Every function takes the better-sqlite3 `Database` handle as its first
// argument (no Hono, no globals) so it can be reused by both the public API
// and the admin API. All SQL uses parameterized prepared statements; JSON
// columns are parsed on read and stringified on write at the boundary.

import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type {
  Car,
  Service,
  Route,
  Feature,
  Faq,
  RouteData,
} from '@/types';
import type {
  Location,
  RouteGroup,
  VehiclePricing,
  VehicleCategory,
} from '@/types/pricing';
import type {
  PublicData,
  PricingData,
  PricingConfig,
  Stat,
  ContactInfo,
  CarCategory,
  CarInput,
  FaqInput,
  FaqRecord,
  RouteDataInput,
  CarPatch,
  FaqPatch,
  RouteDataPatch,
  LocationPatch,
} from '../types.js';

// ---------------------------------------------------------------------------
// Boundary helpers
// ---------------------------------------------------------------------------

/** Parse a JSON string from the database into a typed value. */
function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

/** Read the whole `content` table into a key -> parsed-value map. */
function readContentMap(db: Database.Database): Map<string, unknown> {
  const rows = db
    .prepare('SELECT key, value FROM content')
    .all() as Array<{ key: string; value: string }>;
  const map = new Map<string, unknown>();
  for (const row of rows) {
    map.set(row.key, parseJson<unknown>(row.value));
  }
  return map;
}

/** Read a content key with a typed fallback when the key is absent. */
function getContent<T>(
  map: Map<string, unknown>,
  key: string,
  fallback: T,
): T {
  const raw = map.get(key);
  return raw === undefined ? fallback : (raw as T);
}

// ---------------------------------------------------------------------------
// Raw row shapes (snake_case columns as stored in SQLite)
// ---------------------------------------------------------------------------

interface CarRow {
  id: string;
  nameAr: string;
  category: Car['category'];
  categoryAr: string;
  description: string;
  seo_description: string | null;
  images: string;
  image_alts: string;
  features: string;
  display_order: number;
}

interface FaqRow {
  id: string;
  question: string;
  answer: string;
  display_order: number;
}

interface RouteDataRow {
  id: string;
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
  hero_image: string;
  price_start: string;
  distance: string;
  duration: string;
  features: string;
  faqs: string;
  display_order: number;
}

interface LocationRow {
  id: string;
  name: string;
  nameAr: string;
  type: Location['type'];
  display_order: number;
}

interface RouteGroupRow {
  id: string;
  type: RouteGroup['type'];
  nameAr: string;
  bidirectional: number;
  from_locations: string;
  to_locations: string;
  display_order: number;
}

interface RoutePriceRow {
  vehicle_category: VehicleCategory;
  one_way: number;
  round_trip: number;
}

interface VehiclePricingRow {
  category: VehiclePricing['category'];
  categoryAr: string;
  max_passengers: number;
  min_passengers: number;
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function mapCarRow(row: CarRow): Car {
  return {
    id: row.id,
    nameAr: row.nameAr,
    category: row.category,
    categoryAr: row.categoryAr,
    description: row.description,
    seoDescription: row.seo_description ?? undefined,
    images: parseJson<string[]>(row.images),
    imageAlts: parseJson<string[]>(row.image_alts),
    features: parseJson<string[]>(row.features),
    displayOrder: row.display_order,
  };
}

function mapRouteDataRow(row: RouteDataRow): RouteData {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    heroImage: row.hero_image,
    priceStart: row.price_start,
    distance: row.distance,
    duration: row.duration,
    features: parseJson<string[]>(row.features),
    faqs: parseJson<Faq[]>(row.faqs),
    displayOrder: row.display_order,
  };
}

// ---------------------------------------------------------------------------
// Public read: getPublicData
// ---------------------------------------------------------------------------

/**
 * Returns the full public payload consumed by the landing page.
 * Shapes mirror the original `src/data/*` exports exactly.
 */
export function getPublicData(db: Database.Database): PublicData {
  const content = readContentMap(db);

  const carRows = db
    .prepare('SELECT * FROM cars ORDER BY display_order ASC, id ASC')
    .all() as CarRow[];
  const faqRows = db
    .prepare('SELECT * FROM faqs ORDER BY display_order ASC, id ASC')
    .all() as FaqRow[];
  const routeDataRows = db
    .prepare('SELECT * FROM route_data ORDER BY display_order ASC, id ASC')
    .all() as RouteDataRow[];

  const routeData: Record<string, RouteData> = {};
  for (const row of routeDataRows) {
    routeData[row.id] = mapRouteDataRow(row);
  }

  return {
    services: getContent<Service[]>(content, 'services', []),
    features: getContent<Feature[]>(content, 'features', []),
    routes: getContent<Route[]>(content, 'routes', []),
    stats: getContent<Stat[]>(content, 'stats', []),
    contactInfo: getContent<ContactInfo>(content, 'contactInfo', {
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      facebook: '',
    }),
    cars: carRows.map(mapCarRow),
    carCategories: getContent<CarCategory[]>(content, 'carCategories', []),
    carImages: getContent<Record<string, string[]>>(
      content,
      'carImages',
      {},
    ),
    mockupImages: getContent<string[]>(content, 'mockupImages', []),
    logoImage: getContent<string>(content, 'logoImage', ''),
    faqs: faqRows.map((r) => ({ question: r.question, answer: r.answer })),
    routeData,
  };
}

// ---------------------------------------------------------------------------
// Public read: getPricingData
// ---------------------------------------------------------------------------

function readRoutePricing(
  db: Database.Database,
  routeGroupId: string,
): RouteGroup['pricing'] {
  const rows = db
    .prepare(
      'SELECT vehicle_category, one_way, round_trip FROM route_pricing WHERE route_group_id = ?',
    )
    .all(routeGroupId) as RoutePriceRow[];

  const pricing: RouteGroup['pricing'] = {
    sedan: { oneWay: 0, roundTrip: 0 },
    suv: { oneWay: 0, roundTrip: 0 },
    family_cruiser: { oneWay: 0, roundTrip: 0 },
    minibus: { oneWay: 0, roundTrip: 0 },
  };

  for (const row of rows) {
    pricing[row.vehicle_category] = {
      oneWay: row.one_way,
      roundTrip: row.round_trip,
    };
  }
  return pricing;
}

function readRouteGroups(db: Database.Database): RouteGroup[] {
  const rows = db
    .prepare('SELECT * FROM route_groups ORDER BY display_order ASC, id ASC')
    .all() as RouteGroupRow[];
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    nameAr: row.nameAr,
    bidirectional: row.type === 'travel',
    fromLocations: parseJson<string[]>(row.from_locations),
    toLocations: parseJson<string[]>(row.to_locations),
    pricing: readRoutePricing(db, row.id),
    displayOrder: row.display_order,
  }));
}

function readPricingConfig(db: Database.Database): PricingConfig {
  const row = db
    .prepare('SELECT value FROM pricing_config WHERE key = ?')
    .get('whatsappNumber') as { value: string } | undefined;
  return {
    whatsappNumber: row?.value ?? '',
  };
}

/**
 * Returns the full pricing payload consumed by the pricing calculator.
 * Shapes mirror the original `src/data/pricing.ts` exports exactly.
 */
export function getPricingData(db: Database.Database): PricingData {
  const locationRows = db
    .prepare('SELECT * FROM locations ORDER BY display_order ASC, id ASC')
    .all() as LocationRow[];
  const vehicleRows = db
    .prepare('SELECT * FROM vehicle_pricing')
    .all() as VehiclePricingRow[];

  return {
    locations: locationRows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      type: r.type,
      displayOrder: r.display_order,
    })),
    routeGroups: readRouteGroups(db),
    vehiclePricing: vehicleRows.map((r) => ({
      category: r.category,
      categoryAr: r.categoryAr,
      maxPassengers: r.max_passengers,
      minPassengers: r.min_passengers,
    })),
    pricingConfig: readPricingConfig(db),
  };
}

// ---------------------------------------------------------------------------
// Cars CRUD
// ---------------------------------------------------------------------------

/** Insert a car. Uses `input.id` if provided, otherwise generates one. */
export function createCar(db: Database.Database, input: CarInput): Car {
  const id = input.id ?? `car-${randomUUID()}`;
  const displayOrder =
    input.displayOrder ?? (
      db
        .prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM cars')
        .get() as { next: number }
    ).next;
  db.prepare(
    `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.nameAr,
    input.category,
    input.categoryAr,
    input.description,
    input.seoDescription ?? null,
    JSON.stringify(input.images),
    JSON.stringify(input.imageAlts ?? []),
    JSON.stringify(input.features),
    displayOrder,
  );
  return { ...input, id, displayOrder };
}

/** Partially update a car by id. Only provided fields are written. */
export function updateCar(
  db: Database.Database,
  id: string,
  patch: CarPatch,
): void {
  const fields: Array<[string, unknown]> = [];
  if (patch.nameAr !== undefined) fields.push(['nameAr', patch.nameAr]);
  if (patch.category !== undefined) fields.push(['category', patch.category]);
  if (patch.categoryAr !== undefined)
    fields.push(['categoryAr', patch.categoryAr]);
  if (patch.description !== undefined)
    fields.push(['description', patch.description]);
  if (patch.seoDescription !== undefined)
    fields.push(['seo_description', patch.seoDescription]);
  if (patch.images !== undefined)
    fields.push(['images', JSON.stringify(patch.images)]);
  if (patch.imageAlts !== undefined)
    fields.push(['image_alts', JSON.stringify(patch.imageAlts)]);
  if (patch.features !== undefined)
    fields.push(['features', JSON.stringify(patch.features)]);
  if (patch.displayOrder !== undefined)
    fields.push(['display_order', patch.displayOrder]);

  if (fields.length === 0) return;

  const setClause = fields.map(([col]) => `${col} = ?`).join(', ');
  const values = fields.map(([, val]) => val);
  values.push(id);
  db.prepare(`UPDATE cars SET ${setClause} WHERE id = ?`).run(...values);
}

/** Delete a car by id. */
export function deleteCar(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM cars WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// FAQs CRUD
// ---------------------------------------------------------------------------

/** Insert a FAQ. Generates an id. */
export function createFaq(db: Database.Database, input: FaqInput): FaqRecord {
  const id = `faq-${randomUUID()}`;
  const displayOrder =
    input.displayOrder != null && input.displayOrder !== 0
      ? input.displayOrder
      : (
          db
            .prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM faqs')
            .get() as { next: number }
        ).next;
  db.prepare(
    'INSERT INTO faqs (id, question, answer, display_order) VALUES (?, ?, ?, ?)',
  ).run(id, input.question, input.answer, displayOrder);
  return {
    id,
    question: input.question,
    answer: input.answer,
    displayOrder,
  };
}

/** Partially update a FAQ by id. */
export function updateFaq(
  db: Database.Database,
  id: string,
  patch: FaqPatch,
): void {
  const fields: Array<[string, unknown]> = [];
  if (patch.question !== undefined) fields.push(['question', patch.question]);
  if (patch.answer !== undefined) fields.push(['answer', patch.answer]);
  if (patch.displayOrder !== undefined)
    fields.push(['display_order', patch.displayOrder]);
  if (fields.length === 0) return;

  const setClause = fields.map(([col]) => `${col} = ?`).join(', ');
  const values = fields.map(([, val]) => val);
  values.push(id);
  db.prepare(`UPDATE faqs SET ${setClause} WHERE id = ?`).run(...values);
}

/** Delete a FAQ by id. */
export function deleteFaq(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
}

/** Read all FAQs including their `id`, so the admin UI can target specific
 *  rows for update/delete. Mirrors the `FaqRecord` shape. */
export function getFaqs(db: Database.Database): FaqRecord[] {
  const rows = db
    .prepare('SELECT id, question, answer, display_order FROM faqs ORDER BY display_order ASC, id ASC')
    .all() as FaqRow[];
  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    answer: r.answer,
    displayOrder: r.display_order,
  }));
}

// ---------------------------------------------------------------------------
// RouteData CRUD
// ---------------------------------------------------------------------------

/** Insert a route_data row. `id` is optional; when omitted one is generated. */
export function createRouteData(
  db: Database.Database,
  id: string | undefined,
  input: RouteDataInput,
): RouteData {
  const resolvedId = id ?? `route-${randomUUID()}`;
  const displayOrder =
    input.displayOrder != null && input.displayOrder !== 0
      ? input.displayOrder
      : (
          db
            .prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM route_data')
            .get() as { next: number }
        ).next;
  db.prepare(
    `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    resolvedId,
    input.title,
    input.description,
    input.metaTitle,
    input.metaDescription,
    input.heroImage,
    input.priceStart,
    input.distance,
    input.duration,
    JSON.stringify(input.features),
    JSON.stringify(input.faqs),
    displayOrder,
  );
  return { id: resolvedId, ...input, displayOrder };
}

/** Partially update a route_data row by id. */
export function updateRouteData(
  db: Database.Database,
  id: string,
  patch: RouteDataPatch,
): void {
  const fields: Array<[string, unknown]> = [];
  if (patch.title !== undefined) fields.push(['title', patch.title]);
  if (patch.description !== undefined)
    fields.push(['description', patch.description]);
  if (patch.metaTitle !== undefined) fields.push(['metaTitle', patch.metaTitle]);
  if (patch.metaDescription !== undefined)
    fields.push(['metaDescription', patch.metaDescription]);
  if (patch.heroImage !== undefined) fields.push(['heroImage', patch.heroImage]);
  if (patch.priceStart !== undefined) fields.push(['priceStart', patch.priceStart]);
  if (patch.distance !== undefined) fields.push(['distance', patch.distance]);
  if (patch.duration !== undefined) fields.push(['duration', patch.duration]);
  if (patch.features !== undefined)
    fields.push(['features', JSON.stringify(patch.features)]);
  if (patch.faqs !== undefined) fields.push(['faqs', JSON.stringify(patch.faqs)]);
  if (patch.displayOrder !== undefined)
    fields.push(['display_order', patch.displayOrder]);

  if (fields.length === 0) return;

  const setClause = fields.map(([col]) => `${col} = ?`).join(', ');
  const values = fields.map(([, val]) => val);
  values.push(id);
  db.prepare(`UPDATE route_data SET ${setClause} WHERE id = ?`).run(...values);
}

/** Delete a route_data row by id. */
export function deleteRouteData(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM route_data WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// Content key/value
// ---------------------------------------------------------------------------

/** Store a content value as JSON. */
export function updateContentValue(
  db: Database.Database,
  key: string,
  value: unknown,
): void {
  db.prepare(
    'INSERT OR REPLACE INTO content (key, value) VALUES (?, ?)',
  ).run(key, JSON.stringify(value));
}

/** Read a content value (parsed), or undefined if the key is absent. */
export function getContentValue(db: Database.Database, key: string): unknown {
  const row = db
    .prepare('SELECT value FROM content WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return row === undefined ? undefined : parseJson<unknown>(row.value);
}

// ---------------------------------------------------------------------------
// Locations CRUD
// ---------------------------------------------------------------------------

/** Insert or replace a location. `id` is optional; when omitted one is generated. */
export function upsertLocation(
  db: Database.Database,
  loc: Omit<Location, 'id'> & { id?: string },
): void {
  const id = loc.id ?? `loc-${randomUUID()}`;
  const displayOrder =
    loc.displayOrder != null && loc.displayOrder !== 0
      ? loc.displayOrder
      : (
          db
            .prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM locations')
            .get() as { next: number }
        ).next;
  db.prepare(
    'INSERT OR REPLACE INTO locations (id, name, nameAr, type, display_order) VALUES (?, ?, ?, ?, ?)',
  ).run(id, loc.name, loc.nameAr, loc.type, displayOrder);
}

/** Partially update a location by id. Only provided fields are written. */
export function updateLocation(
  db: Database.Database,
  id: string,
  patch: LocationPatch,
): void {
  const fields: Array<[string, unknown]> = [];
  if (patch.name !== undefined) fields.push(['name', patch.name]);
  if (patch.nameAr !== undefined) fields.push(['nameAr', patch.nameAr]);
  if (patch.type !== undefined) fields.push(['type', patch.type]);
  if (patch.displayOrder !== undefined)
    fields.push(['display_order', patch.displayOrder]);

  if (fields.length === 0) return;

  const setClause = fields.map(([col]) => `${col} = ?`).join(', ');
  const values = fields.map(([, val]) => val);
  values.push(id);
  db.prepare(`UPDATE locations SET ${setClause} WHERE id = ?`).run(...values);
}

/** Delete a location by id. */
export function deleteLocation(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM locations WHERE id = ?').run(id);
}

// ---------------------------------------------------------------------------
// RouteGroups + RoutePricing CRUD
// ---------------------------------------------------------------------------

/** Delete a route group and its dependent route pricing rows (FK-safe). */
export function deleteRouteGroup(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM route_pricing WHERE route_group_id = ?').run(id);
  db.prepare('DELETE FROM route_groups WHERE id = ?').run(id);
}

/** Insert or replace a route group row. `id` is optional; when omitted one is generated. Returns the resolved id. */
export function upsertRouteGroup(
  db: Database.Database,
  rg: Omit<RouteGroup, 'id'> & { id?: string },
): string {
  const id = rg.id ?? `rg-${randomUUID()}`;
  const bidirectional = rg.type === 'travel';
  const displayOrder =
    rg.displayOrder != null && rg.displayOrder !== 0
      ? rg.displayOrder
      : (
          db
            .prepare('SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM route_groups')
            .get() as { next: number }
        ).next;
  db.prepare(
    `INSERT OR REPLACE INTO route_groups (id, type, nameAr, bidirectional, from_locations, to_locations, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    rg.type,
    rg.nameAr,
    bidirectional ? 1 : 0,
    JSON.stringify(rg.fromLocations),
    JSON.stringify(rg.toLocations),
    displayOrder,
  );
  return id;
}

const VEHICLE_CATEGORIES: readonly VehicleCategory[] = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
];

/** True when every category has integer oneWay/roundTrip prices >= 0. */
export function isValidPricing(
  pricing: RouteGroup['pricing'],
): boolean {
  for (const category of VEHICLE_CATEGORIES) {
    const entry = pricing[category];
    if (
      !Number.isInteger(entry.oneWay) ||
      !Number.isInteger(entry.roundTrip) ||
      entry.oneWay < 0 ||
      entry.roundTrip < 0
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Atomically upsert a route group and all four of its route_pricing rows in a
 * single transaction. If any statement throws, the whole transaction rolls
 * back so the group and its pricing stay consistent.
 */
export function upsertRouteGroupWithPricing(
  db: Database.Database,
  rg: Omit<RouteGroup, 'id'> & { id?: string },
): void {
  const run = db.transaction(() => {
    const id = upsertRouteGroup(db, rg);
    const upsertPrice = db.prepare(
      `INSERT OR REPLACE INTO route_pricing (route_group_id, vehicle_category, one_way, round_trip)
       VALUES (?, ?, ?, ?)`,
    );
    for (const category of VEHICLE_CATEGORIES) {
      const entry = rg.pricing[category];
      upsertPrice.run(id, category, entry.oneWay, entry.roundTrip);
    }
  });
  run();
}

// ---------------------------------------------------------------------------
// PricingConfig
// ---------------------------------------------------------------------------

/** Set a single pricing config key/value pair. */
export function setPricingConfig(
  db: Database.Database,
  key: string,
  value: string,
): void {
  db.prepare(
    'INSERT OR REPLACE INTO pricing_config (key, value) VALUES (?, ?)',
  ).run(key, value);
}

// ---------------------------------------------------------------------------
// Reordering
// ---------------------------------------------------------------------------

/**
 * Atomically reorder rows of a table by `display_order`. `orderedIds` must be
 * a permutation of the table's existing ids (no duplicates, no unknowns).
 * Runs inside a single transaction; any failure rolls back the whole update.
 */
export function reorderEntities(
  db: Database.Database,
  table: 'cars' | 'faqs' | 'route_data' | 'locations' | 'route_groups',
  orderedIds: string[],
): void {
  if (orderedIds.length === 0) return;

  const unique = new Set(orderedIds);
  if (unique.size !== orderedIds.length) {
    throw new Error('reorderEntities: duplicate ids in orderedIds');
  }

  const run = db.transaction(() => {
    const update = db.prepare(
      `UPDATE ${table} SET display_order = ? WHERE id = ?`,
    );
    for (let i = 0; i < orderedIds.length; i++) {
      const result = update.run(i, orderedIds[i]);
      if (result.changes === 0) {
        throw new Error(
          `reorderEntities: id "${orderedIds[i]}" does not exist in ${table}`,
        );
      }
    }
  });
  run();
}
