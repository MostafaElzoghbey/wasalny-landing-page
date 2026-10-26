// server/db/queries.ts
// Typed read/write query layer for the Wasalny data-access API, backed by D1.
//
// Every function takes a D1 `D1Database` handle as its first argument (no
// Hono, no globals) so it can be reused by both the public API and the admin
// API. Every function is async because D1 statements are promises, and
// `db.batch()` is used for atomic multi-statement writes where needed.
// All SQL uses parameterized prepared statements; JSON columns are parsed on
// read and stringified on write at the boundary.

import type {
  D1Database,
  D1PreparedStatement,
} from '@cloudflare/workers-types';
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
import { replacePhotosForOwner } from './photos.js';
import type { PhotoInput } from './photos.js';

/** D1 accepts at most 100 bound parameters per statement. */
const MAX_BOUND_PARAMS = 100;

const PRICING_KEY_WHATSAPP = 'whatsappNumber';

/** Tables whose rows carry a manual `display_order`. */
type DisplayOrderTable =
  | 'cars'
  | 'faqs'
  | 'route_data'
  | 'locations'
  | 'route_groups';

// ---------------------------------------------------------------------------
// Boundary helpers
// ---------------------------------------------------------------------------

/** Parse a JSON string from the database into a typed value. */
function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

/** Turn `content` rows into a key -> parsed-value map. */
function readContentMap(rows: readonly ContentRow[]): Map<string, unknown> {
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

/** Split a list so every resulting `IN (...)` query stays under the D1 limit. */
function chunked<T>(
  items: readonly T[],
  size: number = MAX_BOUND_PARAMS,
): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** `COALESCE(MAX(display_order), 0) + 1` for a manually ordered table. */
async function nextDisplayOrder(
  db: D1Database,
  table: DisplayOrderTable,
): Promise<number> {
  const row = await db
    .prepare(`SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM ${table}`)
    .first<{ next: number }>();
  return row?.next ?? 1;
}

// ---------------------------------------------------------------------------
// Raw row shapes (snake_case columns as stored in SQLite)
// ---------------------------------------------------------------------------

interface ContentRow {
  key: string;
  value: string;
}

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
  fromLabel: string;
  toLabel: string;
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
  priceStart: string;
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
  route_group_id: string;
  vehicle_category: VehicleCategory;
  one_way: number;
  round_trip: number;
}

interface PricingConfigRow {
  value: string;
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
    fromLabel: row.fromLabel,
    toLabel: row.toLabel,
    title: row.title,
    description: row.description,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    heroImage: row.heroImage,
    priceStart: row.priceStart,
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
 * Derive the public `routes` array from `route_data` rows so admin-created
 * routes automatically appear as homepage cards and footer links. The output
 * shape mirrors the legacy `content.routes` entries exactly.
 */
export function deriveRoutes(entries: RouteData[]): Route[] {
  return entries.map((e) => ({
    id: e.id,
    from: e.fromLabel,
    to: e.toLabel,
    duration: e.duration,
    description: e.description,
  }));
}

/**
 * Returns the full public payload consumed by the landing page.
 * Shapes mirror the original `src/data/*` exports exactly.
 *
 * The four reads run as one `db.batch()` so the payload is assembled from a
 * single round trip to D1.
 */
export async function getPublicData(db: D1Database): Promise<PublicData> {
  const [contentResult, carResult, faqResult, routeDataResult] = await db.batch(
    [
      db.prepare('SELECT key, value FROM content'),
      db.prepare('SELECT * FROM cars ORDER BY display_order ASC, id ASC'),
      db.prepare('SELECT * FROM faqs ORDER BY display_order ASC, id ASC'),
      db.prepare('SELECT * FROM route_data ORDER BY display_order ASC, id ASC'),
    ],
  );

  const content = readContentMap(contentResult.results as ContentRow[]);
  const routeData: Record<string, RouteData> = {};
  for (const row of routeDataResult.results as RouteDataRow[]) {
    routeData[row.id] = mapRouteDataRow(row);
  }

  return {
    services: getContent<Service[]>(content, 'services', []),
    features: getContent<Feature[]>(content, 'features', []),
    routes: deriveRoutes(Object.values(routeData)),
    stats: getContent<Stat[]>(content, 'stats', []),
    contactInfo: getContent<ContactInfo>(content, 'contactInfo', {
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      facebook: '',
    }),
    cars: (carResult.results as CarRow[]).map(mapCarRow),
    carCategories: getContent<CarCategory[]>(content, 'carCategories', []),
    carImages: getContent<Record<string, string[]>>(
      content,
      'carImages',
      {},
    ),
    mockupImages: getContent<string[]>(content, 'mockupImages', []),
    logoImage: getContent<string>(content, 'logoImage', ''),
    faqs: (faqResult.results as FaqRow[]).map((r) => ({
      question: r.question,
      answer: r.answer,
    })),
    routeData,
  };
}

// ---------------------------------------------------------------------------
// Public read: getPricingData
// ---------------------------------------------------------------------------

/** All-zero pricing skeleton, so absent rows read as free rather than missing. */
function emptyPricing(): RouteGroup['pricing'] {
  return {
    sedan: { oneWay: 0, roundTrip: 0 },
    suv: { oneWay: 0, roundTrip: 0 },
    family_cruiser: { oneWay: 0, roundTrip: 0 },
    minibus: { oneWay: 0, roundTrip: 0 },
  };
}

/**
 * Read every requested route group's pricing in a single query per chunk of
 * ids (D1 caps bound parameters at 100 per statement), instead of one query
 * per route group.
 */
async function readRoutePricing(
  db: D1Database,
  routeGroupIds: readonly string[],
): Promise<Map<string, RouteGroup['pricing']>> {
  const byGroup = new Map<string, RouteGroup['pricing']>();
  for (const id of routeGroupIds) {
    byGroup.set(id, emptyPricing());
  }

  for (const chunk of chunked(routeGroupIds)) {
    const { results } = await db
      .prepare(
        `SELECT route_group_id, vehicle_category, one_way, round_trip
         FROM route_pricing
         WHERE route_group_id IN (${chunk.map(() => '?').join(', ')})`,
      )
      .bind(...chunk)
      .all<RoutePriceRow>();
    for (const row of results) {
      const pricing = byGroup.get(row.route_group_id);
      if (pricing !== undefined) {
        pricing[row.vehicle_category] = {
          oneWay: row.one_way,
          roundTrip: row.round_trip,
        };
      }
    }
  }

  return byGroup;
}

/** Map already-loaded `route_groups` rows, resolving their pricing in one pass. */
async function readRouteGroups(
  db: D1Database,
  rows: readonly RouteGroupRow[],
): Promise<RouteGroup[]> {
  const pricingByGroup = await readRoutePricing(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    nameAr: row.nameAr,
    bidirectional: row.type === 'travel',
    fromLocations: parseJson<string[]>(row.from_locations),
    toLocations: parseJson<string[]>(row.to_locations),
    pricing: pricingByGroup.get(row.id) ?? emptyPricing(),
    displayOrder: row.display_order,
  }));
}

/** Read a pricing config row, or undefined when the key is absent. */
function readPricingConfig(row: PricingConfigRow | null): PricingConfig {
  return {
    whatsappNumber: row?.value ?? '',
  };
}

/**
 * Returns the full pricing payload consumed by the pricing calculator.
 * Shapes mirror the original `src/data/pricing.ts` exports exactly.
 *
 * The location / vehicle / group / config reads run as one `db.batch()`; the
 * route pricing follows in a second query because it is keyed by the group ids
 * that batch returns.
 */
export async function getPricingData(
  db: D1Database,
): Promise<PricingData> {
  const [locationResult, vehicleResult, groupResult, configResult] =
    await db.batch([
      db.prepare('SELECT * FROM locations ORDER BY display_order ASC, id ASC'),
      db.prepare('SELECT * FROM vehicle_pricing'),
      db.prepare('SELECT * FROM route_groups ORDER BY display_order ASC, id ASC'),
      db.prepare('SELECT value FROM pricing_config WHERE key = ?').bind(
        PRICING_KEY_WHATSAPP,
      ),
    ]);

  return {
    locations: (locationResult.results as LocationRow[]).map((r) => ({
      id: r.id,
      name: r.name,
      nameAr: r.nameAr,
      type: r.type,
      displayOrder: r.display_order,
    })),
    routeGroups: await readRouteGroups(db, groupResult.results as RouteGroupRow[]),
    vehiclePricing: (vehicleResult.results as VehiclePricingRow[]).map((r) => ({
      category: r.category,
      categoryAr: r.categoryAr,
      maxPassengers: r.max_passengers,
      minPassengers: r.min_passengers,
    })),
    pricingConfig: readPricingConfig(
      (configResult.results[0] as PricingConfigRow | undefined) ?? null,
    ),
  };
}

/** Read the whole `content` table as a key -> parsed-value record. */
export async function getContentEntries(
  db: D1Database,
): Promise<Record<string, unknown>> {
  const { results } = await db
    .prepare('SELECT key, value FROM content')
    .all<ContentRow>();
  return Object.fromEntries(readContentMap(results).entries());
}

// ---------------------------------------------------------------------------
// Cars CRUD
// ---------------------------------------------------------------------------

/**
 * Zip the admin's two PARALLEL arrays into `PhotoInput`s. `imageAlts` is
 * positionally indexed against `images` (the invariant `validateCar` enforces
 * client-side), so a missing alt becomes `''` for that slot and later pairs
 * must NOT shift.
 */
function toPhotoInputs(
  images: readonly string[],
  imageAlts: readonly string[] | undefined,
): PhotoInput[] {
  return images.map((source, index) => ({
    source,
    alt: imageAlts?.[index] ?? '',
  }));
}

/**
 * Insert a car. Uses `input.id` if provided, otherwise generates one.
 *
 * The id is resolved FIRST because `photos.owner_key` is the car's id: the photo
 * rows cannot be written before the key they hang off is known. The returned
 * `images` are the PERSISTED paths, so a `data:` upload comes back as
 * `/api/photos/<id>` — exactly what a later GET will store.
 *
 * NOT BATCHED WITH THE PHOTO WRITES, ON PURPOSE. `replacePhotosForOwner` runs
 * its own `db.batch()`, and the paths it returns are the very value this INSERT
 * has to bind, so the two cannot share one batch without inverting the
 * dependency. Residual risk: if this INSERT fails — realistically only a
 * duplicate `input.id` from the admin's client-side `generateId('car')` — photo
 * rows for that id already exist. They are not orphans in the dangerous sense
 * (they belong to a real, pre-existing car id and the next save of that car
 * reconciles them), and `deleteCar` sweeps the owner's rows on any later
 * delete.
 */
export async function createCar(
  db: D1Database,
  input: CarInput,
): Promise<Car> {
  const id = input.id ?? `car-${crypto.randomUUID()}`;
  const displayOrder = input.displayOrder ?? (await nextDisplayOrder(db, 'cars'));
  const images = await replacePhotosForOwner(
    db,
    'car',
    id,
    toPhotoInputs(input.images, input.imageAlts),
  );
  await db
    .prepare(
      `INSERT INTO cars (id, nameAr, category, categoryAr, description, seo_description, images, image_alts, features, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.nameAr,
      input.category,
      input.categoryAr,
      input.description,
      input.seoDescription ?? null,
      JSON.stringify(images),
      JSON.stringify(input.imageAlts ?? []),
      JSON.stringify(input.features),
      displayOrder,
    )
    .run();
  return { ...input, id, displayOrder, images };
}

/**
 * Partially update a car by id. Only provided fields are written.
 *
 * `images` is resolved through `replacePhotosForOwner` ONLY when the patch
 * carries it, so a patch that omits `images` cannot reorder, re-encode or prune
 * a single photo row — the 20-image reorder drag in the admin sends `images`
 * though, which is precisely the case that must rewrite zero bytes.
 *
 * A PUT aimed at an id that does not exist writes photo rows no car points at;
 * the next `deleteCar` for that id sweeps them, so they cannot accumulate.
 */
export async function updateCar(
  db: D1Database,
  id: string,
  patch: CarPatch,
): Promise<void> {
  const fields: Array<[string, unknown]> = [];
  if (patch.nameAr !== undefined) fields.push(['nameAr', patch.nameAr]);
  if (patch.category !== undefined) fields.push(['category', patch.category]);
  if (patch.categoryAr !== undefined)
    fields.push(['categoryAr', patch.categoryAr]);
  if (patch.description !== undefined)
    fields.push(['description', patch.description]);
  if (patch.seoDescription !== undefined)
    fields.push(['seo_description', patch.seoDescription]);
  if (patch.images !== undefined) {
    const images = await replacePhotosForOwner(
      db,
      'car',
      id,
      toPhotoInputs(patch.images, patch.imageAlts),
    );
    fields.push(['images', JSON.stringify(images)]);
  }
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
  await db.prepare(`UPDATE cars SET ${setClause} WHERE id = ?`).bind(...values).run();
}

/**
 * Delete a car and its photo rows (FK-safe).
 *
 * `photos.owner_key` is polymorphic, so it carries NO foreign key back to
 * `cars` — `0007_photos.sql` deliberately omits one and makes orphan cleanup the
 * caller's job. Same explicit-batch precedent as `deleteRouteGroup`: both
 * statements land in one transaction, so a failure cannot delete the car and
 * leave its bytes behind.
 */
export async function deleteCar(db: D1Database, id: string): Promise<void> {
  await db.batch([
    db
      .prepare("DELETE FROM photos WHERE owner_type = 'car' AND owner_key = ?")
      .bind(id),
    db.prepare('DELETE FROM cars WHERE id = ?').bind(id),
  ]);
}

// ---------------------------------------------------------------------------
// FAQs CRUD
// ---------------------------------------------------------------------------

/** Insert a FAQ. Generates an id. */
export async function createFaq(
  db: D1Database,
  input: FaqInput,
): Promise<FaqRecord> {
  const id = `faq-${crypto.randomUUID()}`;
  const displayOrder =
    input.displayOrder != null && input.displayOrder !== 0
      ? input.displayOrder
      : await nextDisplayOrder(db, 'faqs');
  await db
    .prepare(
      'INSERT INTO faqs (id, question, answer, display_order) VALUES (?, ?, ?, ?)',
    )
    .bind(id, input.question, input.answer, displayOrder)
    .run();
  return {
    id,
    question: input.question,
    answer: input.answer,
    displayOrder,
  };
}

/** Partially update a FAQ by id. */
export async function updateFaq(
  db: D1Database,
  id: string,
  patch: FaqPatch,
): Promise<void> {
  const fields: Array<[string, unknown]> = [];
  if (patch.question !== undefined) fields.push(['question', patch.question]);
  if (patch.answer !== undefined) fields.push(['answer', patch.answer]);
  if (patch.displayOrder !== undefined)
    fields.push(['display_order', patch.displayOrder]);
  if (fields.length === 0) return;

  const setClause = fields.map(([col]) => `${col} = ?`).join(', ');
  const values = fields.map(([, val]) => val);
  values.push(id);
  await db.prepare(`UPDATE faqs SET ${setClause} WHERE id = ?`).bind(...values).run();
}

/** Delete a FAQ by id. */
export async function deleteFaq(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM faqs WHERE id = ?').bind(id).run();
}

/** Read all FAQs including their `id`, so the admin UI can target specific
 *  rows for update/delete. Mirrors the `FaqRecord` shape. */
export async function getFaqs(db: D1Database): Promise<FaqRecord[]> {
  const { results } = await db
    .prepare(
      'SELECT id, question, answer, display_order FROM faqs ORDER BY display_order ASC, id ASC',
    )
    .all<FaqRow>();
  return results.map((r) => ({
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
export async function createRouteData(
  db: D1Database,
  id: string | undefined,
  input: RouteDataInput,
): Promise<RouteData> {
  const resolvedId = id ?? `route-${crypto.randomUUID()}`;
  const displayOrder =
    input.displayOrder != null && input.displayOrder !== 0
      ? input.displayOrder
      : await nextDisplayOrder(db, 'route_data');
  await db
    .prepare(
      `INSERT INTO route_data (id, title, description, metaTitle, metaDescription, heroImage, priceStart, distance, duration, features, faqs, display_order, fromLabel, toLabel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
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
      input.fromLabel,
      input.toLabel,
    )
    .run();
  return { id: resolvedId, ...input, displayOrder };
}

/** Partially update a route_data row by id. */
export async function updateRouteData(
  db: D1Database,
  id: string,
  patch: RouteDataPatch,
): Promise<void> {
  const fields: Array<[string, unknown]> = [];
  if (patch.fromLabel !== undefined) fields.push(['fromLabel', patch.fromLabel]);
  if (patch.toLabel !== undefined) fields.push(['toLabel', patch.toLabel]);
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
  await db
    .prepare(`UPDATE route_data SET ${setClause} WHERE id = ?`)
    .bind(...values)
    .run();
}

/** Delete a route_data row by id. */
export async function deleteRouteData(
  db: D1Database,
  id: string,
): Promise<void> {
  await db.prepare('DELETE FROM route_data WHERE id = ?').bind(id).run();
}

// ---------------------------------------------------------------------------
// Content key/value
// ---------------------------------------------------------------------------

/** Store a content value as JSON. */
export async function updateContentValue(
  db: D1Database,
  key: string,
  value: unknown,
): Promise<void> {
  await db
    .prepare('INSERT OR REPLACE INTO content (key, value) VALUES (?, ?)')
    .bind(key, JSON.stringify(value))
    .run();
}

/** Read a content value (parsed), or undefined if the key is absent. */
export async function getContentValue(
  db: D1Database,
  key: string,
): Promise<unknown> {
  const row = await db
    .prepare('SELECT value FROM content WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();
  return row === null ? undefined : parseJson<unknown>(row.value);
}

// ---------------------------------------------------------------------------
// Locations CRUD
// ---------------------------------------------------------------------------

/** Insert or replace a location. `id` is optional; when omitted one is generated. */
export async function upsertLocation(
  db: D1Database,
  loc: Omit<Location, 'id' | 'type'> & { id?: string; type?: Location['type'] },
): Promise<void> {
  const id = loc.id ?? `loc-${crypto.randomUUID()}`;
  const type = loc.type ?? 'travel';
  const displayOrder =
    loc.displayOrder != null && loc.displayOrder !== 0
      ? loc.displayOrder
      : await nextDisplayOrder(db, 'locations');
  await db
    .prepare(
      'INSERT OR REPLACE INTO locations (id, name, nameAr, type, display_order) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(id, loc.name, loc.nameAr, type, displayOrder)
    .run();
}

/** Partially update a location by id. Only provided fields are written. */
export async function updateLocation(
  db: D1Database,
  id: string,
  patch: LocationPatch,
): Promise<void> {
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
  await db
    .prepare(`UPDATE locations SET ${setClause} WHERE id = ?`)
    .bind(...values)
    .run();
}

/** Delete a location by id. */
export async function deleteLocation(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM locations WHERE id = ?').bind(id).run();
}

// ---------------------------------------------------------------------------
// RouteGroups + RoutePricing CRUD
// ---------------------------------------------------------------------------

/** Delete a route group and its dependent route pricing rows (FK-safe). */
export async function deleteRouteGroup(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .batch([
      db.prepare('DELETE FROM route_pricing WHERE route_group_id = ?').bind(id),
      db.prepare('DELETE FROM route_groups WHERE id = ?').bind(id),
    ]);
}

/**
 * Resolve the id and `display_order` a route group upsert will write, and build
 * its `INSERT OR REPLACE` statement. Shared by `upsertRouteGroup` (single run)
 * and `upsertRouteGroupWithPricing` (batched with the pricing rows) so the
 * generated id is identical on both paths.
 */
async function buildRouteGroupUpsert(
  db: D1Database,
  rg: Omit<RouteGroup, 'id'> & { id?: string },
): Promise<{ id: string; statement: D1PreparedStatement }> {
  const id = rg.id ?? `rg-${crypto.randomUUID()}`;
  const bidirectional = rg.type === 'travel';
  const displayOrder =
    rg.displayOrder != null && rg.displayOrder !== 0
      ? rg.displayOrder
      : await nextDisplayOrder(db, 'route_groups');
  const statement = db
    .prepare(
      `INSERT OR REPLACE INTO route_groups (id, type, nameAr, bidirectional, from_locations, to_locations, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      rg.type,
      rg.nameAr,
      bidirectional ? 1 : 0,
      JSON.stringify(rg.fromLocations),
      JSON.stringify(rg.toLocations),
      displayOrder,
    );
  return { id, statement };
}

/** Insert or replace a route group row. `id` is optional; when omitted one is generated. Returns the resolved id. */
export async function upsertRouteGroup(
  db: D1Database,
  rg: Omit<RouteGroup, 'id'> & { id?: string },
): Promise<string> {
  const { id, statement } = await buildRouteGroupUpsert(db, rg);
  await statement.run();
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
 * single `db.batch()`. If any statement fails, D1 rolls the whole batch back
 * so the group and its pricing stay consistent.
 */
export async function upsertRouteGroupWithPricing(
  db: D1Database,
  rg: Omit<RouteGroup, 'id'> & { id?: string },
): Promise<void> {
  const { id, statement } = await buildRouteGroupUpsert(db, rg);
  const upsertPrice = db.prepare(
    `INSERT OR REPLACE INTO route_pricing (route_group_id, vehicle_category, one_way, round_trip)
     VALUES (?, ?, ?, ?)`,
  );
  await db.batch([
    statement,
    ...VEHICLE_CATEGORIES.map((category) => {
      const entry = rg.pricing[category];
      return upsertPrice.bind(id, category, entry.oneWay, entry.roundTrip);
    }),
  ]);
}

// ---------------------------------------------------------------------------
// PricingConfig
// ---------------------------------------------------------------------------

/** Set a single pricing config key/value pair. */
export async function setPricingConfig(
  db: D1Database,
  key: string,
  value: string,
): Promise<void> {
  await db
    .prepare('INSERT OR REPLACE INTO pricing_config (key, value) VALUES (?, ?)')
    .bind(key, value)
    .run();
}

// ---------------------------------------------------------------------------
// Reordering
// ---------------------------------------------------------------------------

/**
 * Reorder rows of a table by `display_order`. `orderedIds` must be a
 * permutation of the table's existing ids (no duplicates, no unknowns).
 *
 * Ids are verified to exist *before* any write so an unknown id rejects the
 * whole reorder, preserving the rollback the old `db.transaction()` gave us: a
 * no-op `UPDATE` reports zero changes without failing its batch statement, so
 * detecting a missing row from the batch results alone would still commit
 * every earlier row. The `meta.changes` assertion afterwards is the
 * authoritative check, covering a row deleted between the two round trips.
 */
export async function reorderEntities(
  db: D1Database,
  table: DisplayOrderTable,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;

  const unique = new Set(orderedIds);
  if (unique.size !== orderedIds.length) {
    throw new Error('reorderEntities: duplicate ids in orderedIds');
  }

  const found = new Set<string>();
  for (const chunk of chunked(orderedIds)) {
    const { results } = await db
      .prepare(
        `SELECT id FROM ${table} WHERE id IN (${chunk.map(() => '?').join(', ')})`,
      )
      .bind(...chunk)
      .all<{ id: string }>();
    for (const row of results) {
      found.add(row.id);
    }
  }
  const missing = orderedIds.find((id) => !found.has(id));
  if (missing !== undefined) {
    throw new Error(
      `reorderEntities: id "${missing}" does not exist in ${table}`,
    );
  }

  const update = db.prepare(
    `UPDATE ${table} SET display_order = ? WHERE id = ?`,
  );
  const results = await db.batch(
    orderedIds.map((id, index) => update.bind(index, id)),
  );
  for (const [index, result] of results.entries()) {
    if (result.meta.changes === 0) {
      throw new Error(
        `reorderEntities: id "${orderedIds[index]}" does not exist in ${table}`,
      );
    }
  }
}