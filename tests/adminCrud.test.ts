process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import { hashPassword } from '../server/auth/passwords.js';
import { createCar } from '../server/db/queries.js';
import { adminCrud } from '../server/routes/adminCrud.js';

const SESSION_ID = 'test-session';
const ADMIN_ID = 'admin-test';
const ADMIN_EMAIL = 'admin@example.com';
const COOKIE = `session=${SESSION_ID}`;

describe('adminCrud', () => {
  let db: Database.Database;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    db = getDb();
    migrate(db);
  });

  beforeEach(() => {
    // The in-memory DB is a singleton; reset every table for isolation.
    for (const table of [
      'route_pricing',
      'cars',
      'faqs',
      'route_data',
      'content',
      'pricing_config',
      'locations',
      'route_groups',
      'vehicle_pricing',
      'sessions',
      'admins',
    ]) {
      db.prepare(`DELETE FROM ${table}`).run();
    }

    // Seed a valid admin + session so requireAdmin passes with the cookie.
    const { hash, salt } = hashPassword('secret123');
    db.prepare(
      'INSERT INTO admins (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(ADMIN_ID, ADMIN_EMAIL, hash, salt, new Date().toISOString());
    db.prepare(
      'INSERT INTO sessions (id, admin_id, expires_at) VALUES (?, ?, ?)',
    ).run(SESSION_ID, ADMIN_ID, new Date(Date.now() + 86400000).toISOString());
  });

  describe('auth protection', () => {
    it('GET /cars without a session cookie returns 401', async () => {
      const res = await adminCrud.request('/cars');
      expect(res.status).toBe(401);
    });

    it('POST /cars without a session cookie returns 401', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'x', category: 'sedan' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('cars CRUD', () => {
    it('GET /cars with a valid session returns the cars array', async () => {
      createCar(db, {
        name: 'Seeded Car',
        nameAr: 'سيارة',
        category: 'sedan',
        categoryAr: 'سيدان',
        description: 'desc',
        passengers: 4,
        images: ['a.jpg'],
        features: ['x'],
      });

      const res = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      expect(res.status).toBe(200);
      const body = (await res.json()) as Array<{ id: string; name: string }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((c) => c.name === 'Seeded Car')).toBe(true);
    });

    it('full write round-trip: POST -> GET -> PUT -> DELETE', async () => {
      const created = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          name: 'New Car',
          nameAr: 'جديد',
          category: 'suv',
          categoryAr: 'إس يو في',
          description: 'desc',
          passengers: 5,
          images: ['b.jpg'],
          features: ['y'],
        }),
      });
      expect(created.status).toBe(200);
      const createdBody = (await created.json()) as { id: string };
      const id = createdBody.id;
      expect(typeof id).toBe('string');

      const list = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const listBody = (await list.json()) as Array<{ id: string; name: string }>;
      expect(listBody.some((c) => c.id === id && c.name === 'New Car')).toBe(true);

      const updated = await adminCrud.request(`/cars/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ name: 'Renamed Car' }),
      });
      expect(updated.status).toBe(200);

      const list2 = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const listBody2 = (await list2.json()) as Array<{ id: string; name: string }>;
      expect(listBody2.some((c) => c.id === id && c.name === 'Renamed Car')).toBe(true);

      const deleted = await adminCrud.request(`/cars/${id}`, {
        method: 'DELETE',
        headers: { cookie: COOKIE },
      });
      expect(deleted.status).toBe(200);

      const list3 = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const listBody3 = (await list3.json()) as Array<{ id: string }>;
      expect(listBody3.some((c) => c.id === id)).toBe(false);
    });

    it('POST /cars with missing required field returns 400', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ name: 'No Category' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('faqs CRUD', () => {
    it('POST /faqs then GET /faqs reflects the new faq', async () => {
      const res = await adminCrud.request('/faqs', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ question: 'Q?', answer: 'A.' }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/faqs', { headers: { cookie: COOKIE } });
      expect(list.status).toBe(200);
      const body = (await list.json()) as Array<{ question: string; answer: string }>;
      expect(body.some((f) => f.question === 'Q?' && f.answer === 'A.')).toBe(true);
    });
  });

  describe('route-data CRUD', () => {
    it('POST /route-data then GET /route-data reflects the new route', async () => {
      const res = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'route-1',
          title: 'Route',
          description: 'desc',
          metaTitle: 'm',
          metaDescription: 'md',
          heroImage: 'h.jpg',
          priceStart: '100',
          distance: '10km',
          duration: '20m',
          features: ['f'],
          faqs: [],
        }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/route-data', { headers: { cookie: COOKIE } });
      expect(list.status).toBe(200);
      const body = (await list.json()) as Array<{ id: string; title: string }>;
      expect(body.some((r) => r.id === 'route-1' && r.title === 'Route')).toBe(true);
    });

    it('POST /route-data without id returns 400', async () => {
      const res = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ title: 'No Id' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('content', () => {
    it('PATCH /content then GET /content/:key reflects the change', async () => {
      const res = await adminCrud.request('/content', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ key: 'logoImage', value: 'logo.png' }),
      });
      expect(res.status).toBe(200);

      const get = await adminCrud.request('/content/logoImage', { headers: { cookie: COOKIE } });
      expect(get.status).toBe(200);
      const body = (await get.json()) as { value: unknown };
      expect(body.value).toBe('logo.png');
    });
  });

  describe('locations / route-groups / pricing', () => {
    it('POST /locations then GET /locations reflects it', async () => {
      const res = await adminCrud.request('/locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ id: 'loc-1', name: 'Cairo', nameAr: 'القاهرة', type: 'travel' }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/locations', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{ id: string }>;
      expect(body.some((l) => l.id === 'loc-1')).toBe(true);
    });

    it('POST /route-groups then GET /route-groups reflects it', async () => {
      const res = await adminCrud.request('/route-groups', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'rg-1',
          type: 'travel',
          nameAr: 'خط',
          bidirectional: true,
          fromLocations: ['loc-1'],
          toLocations: ['loc-2'],
        }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/route-groups', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{ id: string }>;
      expect(body.some((r) => r.id === 'rg-1')).toBe(true);
    });

    it('POST /route-pricing returns 200', async () => {
      const group = await adminCrud.request('/route-groups', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'rg-1',
          type: 'travel',
          nameAr: 'خط',
          bidirectional: true,
          fromLocations: ['loc-1'],
          toLocations: ['loc-2'],
        }),
      });
      expect(group.status).toBe(200);

      const res = await adminCrud.request('/route-pricing', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          routeGroupId: 'rg-1',
          vehicleCategory: 'sedan',
          oneWay: 100,
          roundTrip: 180,
        }),
      });
      expect(res.status).toBe(200);
    });

    it('POST /vehicle-pricing returns 200', async () => {
      const res = await adminCrud.request('/vehicle-pricing', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          category: 'sedan',
          categoryAr: 'سيدان',
          maxPassengers: 4,
          minPassengers: 1,
        }),
      });
      expect(res.status).toBe(200);
    });

    it('POST /pricing-config returns 200', async () => {
      const res = await adminCrud.request('/pricing-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ key: 'currency', value: 'EGP' }),
      });
      expect(res.status).toBe(200);
    });
  });
});
