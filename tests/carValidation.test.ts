process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import { hashPassword } from '../server/auth/passwords.js';
import { adminCrud } from '../server/routes/adminCrud.js';

const SESSION_ID = 'test-session';
const ADMIN_ID = 'admin-test';
const ADMIN_EMAIL = 'admin@example.com';
const COOKIE = `session=${SESSION_ID}`;

const VALID_CAR_BODY = {
  nameAr: 'سيدان عادي',
  category: 'sedan',
  categoryAr: 'سيدان',
  description: 'سيارة سيدان',
  images: ['img1.jpg'],
  features: ['مكيف'],
};

describe('car input validation', () => {
  let db: Database.Database;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    db = getDb();
    migrate(db);
  });

  beforeEach(() => {
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

    const { hash, salt } = hashPassword('secret123');
    db.prepare(
      'INSERT INTO admins (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(ADMIN_ID, ADMIN_EMAIL, hash, salt, new Date().toISOString());
    db.prepare(
      'INSERT INTO sessions (id, admin_id, expires_at) VALUES (?, ?, ?)',
    ).run(SESSION_ID, ADMIN_ID, new Date(Date.now() + 86400000).toISOString());
  });

  // -------------------------------------------------------------------------
  // POST /cars — full validation
  // -------------------------------------------------------------------------

  describe('POST /cars', () => {
    it('spaces-only nameAr returns 400 with no DB write', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ ...VALID_CAR_BODY, nameAr: '   ' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
      // No car in DB
      const count = db.prepare('SELECT COUNT(*) AS n FROM cars').get() as { n: number };
      expect(count.n).toBe(0);
    });

    it('invalid category returns 400 with no DB write', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ ...VALID_CAR_BODY, category: 'truck' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
      const count = db.prepare('SELECT COUNT(*) AS n FROM cars').get() as { n: number };
      expect(count.n).toBe(0);
    });

    it('missing images array returns 400 with no DB write', async () => {
      const bodyNoImages = {
        nameAr: VALID_CAR_BODY.nameAr,
        category: VALID_CAR_BODY.category,
        categoryAr: VALID_CAR_BODY.categoryAr,
        description: VALID_CAR_BODY.description,
        features: VALID_CAR_BODY.features,
      };
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify(bodyNoImages),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
      const count = db.prepare('SELECT COUNT(*) AS n FROM cars').get() as { n: number };
      expect(count.n).toBe(0);
    });

    it('images with empty-string entries returns 400', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ ...VALID_CAR_BODY, images: [''] }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
      const count = db.prepare('SELECT COUNT(*) AS n FROM cars').get() as { n: number };
      expect(count.n).toBe(0);
    });

    it('wedding category is accepted', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ ...VALID_CAR_BODY, category: 'wedding', categoryAr: 'زفاف' }),
      });
      expect(res.status).toBe(200);
    });

    it('valid body returns 200', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify(VALID_CAR_BODY),
      });
      expect(res.status).toBe(200);
      const count = db.prepare('SELECT COUNT(*) AS n FROM cars').get() as { n: number };
      expect(count.n).toBe(1);
    });

    it('valid body with empty images array is accepted', async () => {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ ...VALID_CAR_BODY, images: [] }),
      });
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // PUT /cars/:id — partial validation
  // -------------------------------------------------------------------------

  describe('PUT /cars/:id', () => {
    async function createFixture(): Promise<string> {
      const res = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify(VALID_CAR_BODY),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { id: string };
      return body.id;
    }

    it('spaces-only nameAr returns 400 with DB unchanged', async () => {
      const id = await createFixture();
      const res = await adminCrud.request(`/cars/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ nameAr: '   ' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
      // DB unchanged
      const list = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const cars = (await list.json()) as Array<{ id: string; nameAr: string }>;
      const car = cars.find((c) => c.id === id);
      expect(car?.nameAr).toBe(VALID_CAR_BODY.nameAr);
    });

    it('invalid category returns 400 with DB unchanged', async () => {
      const id = await createFixture();
      const res = await adminCrud.request(`/cars/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ category: 'truck' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
      // DB unchanged
      const list = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const cars = (await list.json()) as Array<{ id: string; category: string }>;
      const car = cars.find((c) => c.id === id);
      expect(car?.category).toBe('sedan');
    });

    it('images with empty-string entries returns 400', async () => {
      const id = await createFixture();
      const res = await adminCrud.request(`/cars/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ images: ['   '] }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe('string');
    });

    it('valid partial update returns 200', async () => {
      const id = await createFixture();
      const res = await adminCrud.request(`/cars/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ nameAr: 'اسم جديد' }),
      });
      expect(res.status).toBe(200);
      const list = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const cars = (await list.json()) as Array<{ id: string; nameAr: string }>;
      const car = cars.find((c) => c.id === id);
      expect(car?.nameAr).toBe('اسم جديد');
    });
  });
});
