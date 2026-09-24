// server/routes/adminCrud.ts
// Admin CRUD API for the Wasalny data layer. Every route is protected by the
// `requireAdmin` middleware so unauthenticated requests are rejected with 401.

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getDb } from '../db/connection.js';
import {
  createCar,
  updateCar,
  deleteCar,
  createFaq,
  updateFaq,
  deleteFaq,
  getFaqs,
  createRouteData,
  updateRouteData,
  deleteRouteData,
  updateContentValue,
  getContentValue,
  upsertLocation,
  updateLocation,
  deleteLocation,
  upsertRouteGroup,
  upsertRouteGroupWithPricing,
  isValidPricing,
  deleteRouteGroup,
  setPricingConfig,
  getPublicData,
  getPricingData,
  reorderEntities,
} from '../db/queries.js';
import { requireAdmin } from '../middleware/auth.js';
import type { CarInput } from '../types.js';
import type { RouteData, Faq, Location, RouteGroup } from '@/types';

export const adminCrud = new Hono();

// ---------------------------------------------------------------------------
// Reorder helper
// ---------------------------------------------------------------------------

type ReorderTable = 'cars' | 'faqs' | 'route_data' | 'locations' | 'route_groups';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * Shared handler for `POST /<entity>/reorder`. Validates that `ids` is a
 * non-empty array of unique strings, then applies the new display_order
 * atomically. Returns 400 on any invalid input, 200 on success.
 */
async function reorderRoute(
  c: Context,
  table: ReorderTable,
): Promise<Response> {
  const db = getDb();
  const body = await c.req.json<{ ids?: unknown }>();
  if (!isStringArray(body.ids) || body.ids.length === 0) {
    return c.json({ error: 'ids must be a non-empty array of strings' }, 400);
  }
  if (new Set(body.ids).size !== body.ids.length) {
    return c.json({ error: 'ids must not contain duplicates' }, 400);
  }
  try {
    reorderEntities(db, table, body.ids);
  } catch {
    return c.json({ error: 'one or more ids do not exist' }, 400);
  }
  return c.json({ ok: true }, 200);
}

// ---------------------------------------------------------------------------
// Cars — validation
// ---------------------------------------------------------------------------

const CAR_CATEGORIES = [
  'sedan',
  'suv',
  'family_cruiser',
  'minibus',
  'wedding',
] as const;

interface CarValidationError {
  error: string;
}

/**
 * Shared validation for car create (full) and update (partial).
 * Returns `null` when valid, `{ error }` message when invalid.
 */
function validateCarInput(
  body: Record<string, unknown>,
  opts: { partial: boolean },
): CarValidationError | null {
  const { partial } = opts;

  if (!partial) {
    if (typeof body.nameAr !== 'string') {
      return { error: 'nameAr is required' };
    }
  }
  if (typeof body.nameAr === 'string' && body.nameAr.trim().length === 0) {
    return { error: 'nameAr must not be empty' };
  }

  if (!partial) {
    if (typeof body.category !== 'string') {
      return { error: 'category is required' };
    }
  }
  if (typeof body.category === 'string') {
    if (!(CAR_CATEGORIES as readonly string[]).includes(body.category)) {
      return {
        error: `category must be one of: ${CAR_CATEGORIES.join(', ')}`,
      };
    }
  }

  if (!partial) {
    if (!Array.isArray(body.images)) {
      return { error: 'images is required' };
    }
  }
  if (Array.isArray(body.images)) {
    if (!body.images.every((img: unknown) => typeof img === 'string' && img.trim().length > 0)) {
      return { error: 'every image must be a non-empty string' };
    }
  }

  if (body.features !== undefined && !Array.isArray(body.features)) {
    return { error: 'features must be an array' };
  }

  if (body.displayOrder !== undefined) {
    if (typeof body.displayOrder !== 'number' || !Number.isInteger(body.displayOrder) || body.displayOrder < 0) {
      return { error: 'displayOrder must be a non-negative integer' };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Cars
// ---------------------------------------------------------------------------

adminCrud.get('/cars', requireAdmin, (c) => {
  const db = getDb();
  return c.json(getPublicData(db).cars);
});

adminCrud.post('/cars', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<CarInput>();
  const err = validateCarInput(body, { partial: false });
  if (err) return c.json(err, 400);
  const car = createCar(db, body);
  return c.json(car, 200);
});

adminCrud.put('/cars/:id', requireAdmin, async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  const patch = await c.req.json<Partial<CarInput>>();
  const err = validateCarInput(patch, { partial: true });
  if (err) return c.json(err, 400);
  updateCar(db, id, patch);
  return c.json({ ok: true }, 200);
});

adminCrud.delete('/cars/:id', requireAdmin, (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  deleteCar(db, id);
  return c.json({ ok: true }, 200);
});

adminCrud.post('/cars/reorder', requireAdmin, (c) => reorderRoute(c, 'cars'));

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

adminCrud.get('/faqs', requireAdmin, (c) => {
  const db = getDb();
  return c.json(getFaqs(db));
});

adminCrud.post('/faqs', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<Faq>();
  if (body.question === undefined || body.answer === undefined) {
    return c.json({ error: 'question and answer are required' }, 400);
  }
  const faq = createFaq(db, body);
  return c.json(faq, 200);
});

adminCrud.put('/faqs/:id', requireAdmin, async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  const patch = await c.req.json<Partial<Faq>>();
  updateFaq(db, id, patch);
  return c.json({ ok: true }, 200);
});

adminCrud.delete('/faqs/:id', requireAdmin, (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  deleteFaq(db, id);
  return c.json({ ok: true }, 200);
});

adminCrud.post('/faqs/reorder', requireAdmin, (c) => reorderRoute(c, 'faqs'));

// ---------------------------------------------------------------------------
// RouteData
// ---------------------------------------------------------------------------

adminCrud.get('/route-data', requireAdmin, (c) => {
  const db = getDb();
  return c.json(Object.values(getPublicData(db).routeData));
});

adminCrud.post('/route-data', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<RouteData>();
  const { id, ...rest } = body;
  if (id === undefined || id === null || id === '') {
    return c.json({ error: 'id is required' }, 400);
  }
  if (typeof rest.fromLabel !== 'string' || rest.fromLabel.trim() === '') {
    return c.json({ error: 'fromLabel is required' }, 400);
  }
  if (typeof rest.toLabel !== 'string' || rest.toLabel.trim() === '') {
    return c.json({ error: 'toLabel is required' }, 400);
  }
  const route = createRouteData(db, id, rest);
  return c.json(route, 200);
});

adminCrud.put('/route-data/:id', requireAdmin, async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  const patch = await c.req.json<Partial<Omit<RouteData, 'id'>>>();
  if (
    patch.fromLabel !== undefined &&
    (typeof patch.fromLabel !== 'string' || patch.fromLabel.trim() === '')
  ) {
    return c.json({ error: 'fromLabel must not be empty' }, 400);
  }
  if (
    patch.toLabel !== undefined &&
    (typeof patch.toLabel !== 'string' || patch.toLabel.trim() === '')
  ) {
    return c.json({ error: 'toLabel must not be empty' }, 400);
  }
  updateRouteData(db, id, patch);
  return c.json({ ok: true }, 200);
});

adminCrud.delete('/route-data/:id', requireAdmin, (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  deleteRouteData(db, id);
  return c.json({ ok: true }, 200);
});

adminCrud.post('/route-data/reorder', requireAdmin, (c) => reorderRoute(c, 'route_data'));

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

adminCrud.get('/content/:key', requireAdmin, (c) => {
  const db = getDb();
  const key = c.req.param('key');
  if (key === undefined) {
    return c.json({ error: 'key is required' }, 400);
  }
  const value = getContentValue(db, key);
  return c.json({ value: value ?? null });
});

adminCrud.patch('/content', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<{ key: string; value: unknown }>();
  if (body.key === undefined) {
    return c.json({ error: 'key is required' }, 400);
  }
  updateContentValue(db, body.key, body.value);
  return c.json({ ok: true }, 200);
});

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

adminCrud.get('/locations', requireAdmin, (c) => {
  const db = getDb();
  return c.json(getPricingData(db).locations);
});

adminCrud.post('/locations', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<Location>();
  upsertLocation(db, body);
  return c.json({ ok: true }, 200);
});

adminCrud.put('/locations/:id', requireAdmin, async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  const patch = await c.req.json<Partial<Location>>();
  if (patch.name !== undefined && patch.name.trim() === '') {
    return c.json({ error: 'name must not be empty' }, 400);
  }
  if (patch.nameAr !== undefined && patch.nameAr.trim() === '') {
    return c.json({ error: 'nameAr must not be empty' }, 400);
  }
  if (patch.type !== undefined && patch.type !== 'travel' && patch.type !== 'internal') {
    return c.json({ error: 'type must be travel or internal' }, 400);
  }
  updateLocation(db, id, patch);
  return c.json({ ok: true }, 200);
});

adminCrud.delete('/locations/:id', requireAdmin, (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  deleteLocation(db, id);
  return c.json({ ok: true }, 200);
});

adminCrud.post('/locations/reorder', requireAdmin, (c) => reorderRoute(c, 'locations'));

// ---------------------------------------------------------------------------
// RouteGroups
// ---------------------------------------------------------------------------

adminCrud.get('/route-groups', requireAdmin, (c) => {
  const db = getDb();
  return c.json(getPricingData(db).routeGroups);
});

adminCrud.post('/route-groups', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<RouteGroup>();
  if (body.nameAr === undefined) {
    return c.json({ error: 'nameAr is required' }, 400);
  }
  if (body.pricing !== undefined && !isValidPricing(body.pricing)) {
    return c.json({ error: 'pricing must be non-negative integers' }, 400);
  }
  if (body.pricing !== undefined) {
    upsertRouteGroupWithPricing(db, body);
  } else {
    upsertRouteGroup(db, body);
  }
  return c.json({ ok: true }, 200);
});

adminCrud.put('/route-groups/:id', requireAdmin, async (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  const body = await c.req.json<RouteGroup>();
  if (body.id !== undefined && body.id !== id) {
    return c.json({ error: 'id in body does not match path' }, 400);
  }
  if (body.nameAr === undefined || body.nameAr.trim() === '') {
    return c.json({ error: 'nameAr is required' }, 400);
  }
  if (body.type !== 'travel' && body.type !== 'internal') {
    return c.json({ error: 'type must be travel or internal' }, 400);
  }
  if (typeof body.bidirectional !== 'boolean') {
    return c.json({ error: 'bidirectional must be a boolean' }, 400);
  }
  if (
    !Array.isArray(body.fromLocations) ||
    !Array.isArray(body.toLocations)
  ) {
    return c.json({ error: 'fromLocations and toLocations must be arrays' }, 400);
  }
  if (!isValidPricing(body.pricing)) {
    return c.json({ error: 'pricing must be non-negative integers' }, 400);
  }
  upsertRouteGroupWithPricing(db, { ...body, id });
  return c.json({ ok: true }, 200);
});

adminCrud.delete('/route-groups/:id', requireAdmin, (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  deleteRouteGroup(db, id);
  return c.json({ ok: true }, 200);
});

adminCrud.post('/route-groups/reorder', requireAdmin, (c) => reorderRoute(c, 'route_groups'));

// ---------------------------------------------------------------------------
// PricingConfig
// ---------------------------------------------------------------------------

const PRICING_KEY_WHATSAPP = 'whatsappNumber' as const;

/** E.164-ish: optional +, 7-15 digits (after stripping whitespace/dashes). */
const PHONE_DIGITS_RE = /^\+?[0-9]{7,15}$/;

function normalizeWhatsAppNumber(raw: string): string | null {
  const stripped = raw.replace(/[\s-]/g, '');
  if (!PHONE_DIGITS_RE.test(stripped)) return null;
  return stripped.startsWith('+') ? stripped : `+${stripped}`;
}

adminCrud.post('/pricing-config', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<{ key: string; value: string }>();
  if (body.key === undefined || body.value === undefined) {
    return c.json({ error: 'key and value are required' }, 400);
  }

  // Allowlist: only whatsappNumber is accepted.
  if (body.key !== PRICING_KEY_WHATSAPP) {
    return c.json({ error: 'unsupported pricing key' }, 400);
  }

  const normalized = normalizeWhatsAppNumber(body.value);
  if (normalized === null) {
    return c.json({ error: 'invalid whatsappNumber' }, 400);
  }

  setPricingConfig(db, PRICING_KEY_WHATSAPP, normalized);
  return c.json({ ok: true }, 200);
});
