// server/routes/adminCrud.ts
// Admin CRUD API for the Wasalny data layer. Every route is protected by the
// `requireAdmin` middleware so unauthenticated requests are rejected with 401.

import { Hono } from 'hono';
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
  deleteLocation,
  upsertRouteGroup,
  deleteRouteGroup,
  upsertRoutePrice,
  upsertVehiclePricing,
  setPricingConfig,
  getPublicData,
  getPricingData,
} from '../db/queries.js';
import { requireAdmin } from '../middleware/auth.js';
import type { CarInput } from '../types.js';
import type { RouteData, Faq, Location, RouteGroup, VehiclePricing } from '@/types';
import type { VehicleCategory } from '@/types/pricing';

export const adminCrud = new Hono();

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
  if (body.name === undefined || body.category === undefined) {
    return c.json({ error: 'name and category are required' }, 400);
  }
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
  if (body.id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  const { id, ...rest } = body;
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

adminCrud.delete('/locations/:id', requireAdmin, (c) => {
  const db = getDb();
  const id = c.req.param('id');
  if (id === undefined) {
    return c.json({ error: 'id is required' }, 400);
  }
  deleteLocation(db, id);
  return c.json({ ok: true }, 200);
});

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
  upsertRouteGroup(db, body);
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

// ---------------------------------------------------------------------------
// RoutePricing
// ---------------------------------------------------------------------------

adminCrud.post('/route-pricing', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<{
    routeGroupId: string;
    vehicleCategory: VehicleCategory;
    oneWay: number;
    roundTrip: number;
  }>();
  if (
    body.routeGroupId === undefined ||
    body.vehicleCategory === undefined ||
    body.oneWay === undefined ||
    body.roundTrip === undefined
  ) {
    return c.json(
      { error: 'routeGroupId, vehicleCategory, oneWay and roundTrip are required' },
      400,
    );
  }
  upsertRoutePrice(
    db,
    body.routeGroupId,
    body.vehicleCategory,
    body.oneWay,
    body.roundTrip,
  );
  return c.json({ ok: true }, 200);
});

// ---------------------------------------------------------------------------
// VehiclePricing
// ---------------------------------------------------------------------------

adminCrud.post('/vehicle-pricing', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<VehiclePricing>();
  upsertVehiclePricing(db, body);
  return c.json({ ok: true }, 200);
});

// ---------------------------------------------------------------------------
// PricingConfig
// ---------------------------------------------------------------------------

adminCrud.post('/pricing-config', requireAdmin, async (c) => {
  const db = getDb();
  const body = await c.req.json<{ key: string; value: string }>();
  if (body.key === undefined || body.value === undefined) {
    return c.json({ error: 'key and value are required' }, 400);
  }
  setPricingConfig(db, body.key, body.value);
  return c.json({ ok: true }, 200);
});
