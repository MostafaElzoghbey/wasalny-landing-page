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
  name: string;
  nameAr: string;
  category: Car['category'];
  categoryAr: string;
  description: string;
  seo_description: string | null;
  passengers: number;
  images: string;
  image_alts: string;
  features: string;
}

interface FaqRow {
  id: string;
  question: string;
  answer: string;
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
}

interface LocationRow {
  id: string;
  name: string;
  nameAr: string;
  type: Location['type'];
}

interface RouteGroupRow {
  id: string;
  type: RouteGroup['type'];
  nameAr: string;
  bidirectional: number;
  from_locations: string;
  to_locations: string;
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
    name: row.name,
    nameAr: row.nameAr,
    category: row.category,
    categoryAr: row.categoryAr,
    description: row.description,
    seoDescription: row.seo_description ?? undefined,
    passengers: row.passengers,
    images: parseJson<string[]>(row.images),
    imageAlts: parseJson<string[]>(row.image_alts),
    features: parseJson<string[]>(row.features),
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

  const carRows = db.prepare('SELECT * FROM cars').all() as CarRow[];
  const faqRows = db.prepare('SELECT * FROM faqs').all() as FaqRow[];
  const routeDataRows = db
    .prepare('SELECT * FROM route_data')
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
  const rows = db.prepare('SELECT * FROM route_groups').all() as RouteGroupRow[];
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    nameAr: row.nameAr,
    bidirectional: row.bidirectional === 1,
    fromLocations: parseJson<string[]>(row.from_locations),
    toLocations: parseJson<string[]>(row.to_locations),
    pricing: readRoutePricing(db, row.id),
  }));
}

function readPricingConfig(db: Database.Database): PricingConfig {
  const rows = db
    .prepare('SELECT key, value FROM pricing_config')
    .all() as Array<{ key: string; value: string }>;
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    currency: map.get('currency') ?? '',
    currencyAr: map.get('currencyAr') ?? '',
    whatsappNumber: map.get('whatsappNumber') ?? '',
    contactEmail: map.get('contactEmail') ?? '',
  };
}

/**
 * Returns the full pricing payload consumed by the pricing calculator.
 * Shapes mirror the original `src/data/pricing.ts` exports exactly.
 */
export function getPricingData(db: Database.Database): PricingData {
  const locationRows = db.prepare('SELECT * FROM locations').all() as LocationRow[];
  const vehicleRows = db
    .prepare('SELECT * FROM vehicle_pricing')
    .all() as VehiclePricingRow[];

  return {
    locations: locationRows.map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      type: r.type,
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
  db.prepare(
    `INSERT INTO cars (id, name, nameAr, category, categoryAr, description, seo_description, passengers, images, image_alts, features)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name,
    input.nameAr,
    input.category,
    input.categoryAr,
    input.description,
    input.seoDescription ?? null,
    input.passengers,
    JSON.stringify(input.images),
    JSON.stringify(input.imageAlts ?? []),
    JSON.stringify(input.features),
  );
  return { ...input, id };
}

/** Partially update a car by id. Only provided fields are written. */
export function updateCar(
  db: Database.Database,
  id: string,
  patch: CarPatch,
): void {
  const fields: Array<[string, unknown]> = [];
  if (patch.name !== undefined) fields.push(['name', patch.name]);
  if (patch.nameAr !== undefined) fields.push(['nameAr', patch.nameAr]);
  if (patch.category !== undefined) fields.push(['category', patch.category]);
  if (patch.categoryAr !== undefined)
    fields.push(['categoryAr', patch.categoryAr]);
  if (patch.description !== undefined)
    fields.push(['description', patch.description]);
  if (patch.seoDescription !== undefined)
    fields.push(['seo_description', patch.seoDescription]);
  if (patch.passengers !== undefined)
    fields.push(['passengers', patch.passengers]);
  if (patch.images !== undefined)
    fields.push(['images', JSON.stringify(patch.images)]);
  if (patch.imageAlts !== undefined)
    fields.push(['image_alts', JSON.stringify(patch.imageAlts)]);
  if (patch.features !== undefined)
    fields.push(['features', JSON.stringify(patch.features)]);

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
  db.prepare('INSERT INTO faqs (id, question, answer) VALUES (?, ?, ?)').run(
    id,
    input.question,
    input.answer,
  );
  return { id, question: input.question, answer: input.answer };
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

/** Read all FAQs as `Faq[]` (no id), matching the frontend `Faq` shape. */
export function getFaqs(db: Database.Database): Faq[] {
  const rows = db.prepare('SELECT * FROM faqs').all() as FaqRow[];
  return rows.map((r) => ({ question: r.question, answer: r.answer }));
}

// ---------------------------------------------------------------------------
// RouteData CRUD
// ---------------------------------------------------------------------------

/** Insert a route_data row. `id` is supplied by the caller. */
export function createRouteData(
  db: Database.Database,
  id: string,
  input: RouteDataInput,
): RouteData {
  db.prepare(
    `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
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
  );
  return { id, ...input };
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

/** Insert or replace a location. */
export function upsertLocation(db: Database.Database, loc: Location): void {
  db.prepare(
    'INSERT OR REPLACE INTO locations (id, name, nameAr, type) VALUES (?, ?, ?, ?)',
  ).run(loc.id, loc.name, loc.nameAr, loc.type);
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

/** Insert or replace a route group row (pricing is managed via upsertRoutePrice). */
export function upsertRouteGroup(db: Database.Database, rg: RouteGroup): void {
  db.prepare(
    `INSERT OR REPLACE INTO route_groups (id, type, nameAr, bidirectional, from_locations, to_locations)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    rg.id,
    rg.type,
    rg.nameAr,
    rg.bidirectional ? 1 : 0,
    JSON.stringify(rg.fromLocations),
    JSON.stringify(rg.toLocations),
  );
}

/** Insert or replace a single vehicle price for a route group. */
export function upsertRoutePrice(
  db: Database.Database,
  routeGroupId: string,
  vehicleCategory: VehicleCategory,
  oneWay: number,
  roundTrip: number,
): void {
  db.prepare(
    `INSERT OR REPLACE INTO route_pricing (route_group_id, vehicle_category, one_way, round_trip)
     VALUES (?, ?, ?, ?)`,
  ).run(routeGroupId, vehicleCategory, oneWay, roundTrip);
}

// ---------------------------------------------------------------------------
// VehiclePricing CRUD
// ---------------------------------------------------------------------------

/** Insert or replace a vehicle pricing row. */
export function upsertVehiclePricing(
  db: Database.Database,
  vp: VehiclePricing,
): void {
  db.prepare(
    `INSERT OR REPLACE INTO vehicle_pricing (category, categoryAr, max_passengers, min_passengers)
     VALUES (?, ?, ?, ?)`,
  ).run(vp.category, vp.categoryAr, vp.maxPassengers, vp.minPassengers);
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
