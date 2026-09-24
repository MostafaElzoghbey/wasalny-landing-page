process.env.NODE_ENV = 'test';

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import type Database from 'better-sqlite3';
import { getDb } from '../server/db/connection.js';
import { migrate } from '../server/db/migrate.js';
import { hashPassword } from '../server/auth/passwords.js';
import { createCar } from '../server/db/queries.js';
import { adminCrud } from '../server/routes/adminCrud.js';
import { publicApi } from '../server/routes/public.js';

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
        body: JSON.stringify({ nameAr: 'x', category: 'sedan' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('cars CRUD', () => {
    it('GET /cars with a valid session returns the cars array', async () => {
      createCar(db, {
        nameAr: 'سيارة',
        category: 'sedan',
        categoryAr: 'سيدان',
        description: 'desc',
        images: ['a.jpg'],
        features: ['x'],
      });

      const res = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      expect(res.status).toBe(200);
      const body = (await res.json()) as Array<{ id: string; nameAr: string }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((c) => c.nameAr === 'سيارة')).toBe(true);
    });

    it('full write round-trip: POST -> GET -> PUT -> DELETE', async () => {
      const created = await adminCrud.request('/cars', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          nameAr: 'جديد',
          category: 'suv',
          categoryAr: 'إس يو في',
          description: 'desc',
          images: ['b.jpg'],
          features: ['y'],
        }),
      });
      expect(created.status).toBe(200);
      const createdBody = (await created.json()) as { id: string };
      const id = createdBody.id;
      expect(typeof id).toBe('string');

      const list = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const listBody = (await list.json()) as Array<{ id: string; nameAr: string }>;
      expect(listBody.some((c) => c.id === id && c.nameAr === 'جديد')).toBe(true);

      const updated = await adminCrud.request(`/cars/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ nameAr: 'جديد جداً' }),
      });
      expect(updated.status).toBe(200);

      const list2 = await adminCrud.request('/cars', { headers: { cookie: COOKIE } });
      const listBody2 = (await list2.json()) as Array<{ id: string; nameAr: string }>;
      expect(listBody2.some((c) => c.id === id && c.nameAr === 'جديد جداً')).toBe(true);

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
        body: JSON.stringify({ nameAr: 'No Category' }),
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
          fromLabel: 'دمياط',
          toLabel: 'القاهرة',
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

    it('round-trips metaTitle/metaDescription/heroImage/priceStart/fromLabel/toLabel through POST -> GET', async () => {
      // Given: a route created with unmistakable sentinel values for the four
      // fields the row mapper used to drop (snake_case read bug) plus the two
      // new label columns.
      const res = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'route-sentinel',
          fromLabel: 'من',
          toLabel: 'إلى',
          title: 'رحلة الاختبار',
          description: 'وصف الرحلة',
          metaTitle: 'سيلن ميتا',
          metaDescription: 'وصف ميتا للاختبار',
          heroImage: 'data:image/png;base64,AAAA',
          priceStart: '1999',
          distance: '10 كم',
          duration: 'ساعة',
          features: ['مكيف'],
          faqs: [],
        }),
      });
      expect(res.status).toBe(200);

      // When: the route is read back through the admin list endpoint.
      const list = await adminCrud.request('/route-data', { headers: { cookie: COOKIE } });
      expect(list.status).toBe(200);
      const body = (await list.json()) as Array<Record<string, unknown>>;
      const route = body.find((r) => r.id === 'route-sentinel');

      // Then: every recovered field survives byte-identical — not merely present.
      expect(route).toBeDefined();
      expect(route?.metaTitle).toBe('سيلن ميتا');
      expect(route?.metaDescription).toBe('وصف ميتا للاختبار');
      expect(route?.heroImage).toBe('data:image/png;base64,AAAA');
      expect(route?.priceStart).toBe('1999');
      expect(route?.fromLabel).toBe('من');
      expect(route?.toLabel).toBe('إلى');
    });

    it('POST /route-data without fromLabel returns 400 with fromLabel is required', async () => {
      const res = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'route-no-from',
          toLabel: 'القاهرة',
          title: 'رحلة',
          description: 'وصف',
          metaTitle: 'ميتا',
          metaDescription: 'وصف ميتا',
          heroImage: 'h.jpg',
          priceStart: '100',
          distance: '10 كم',
          duration: 'ساعة',
          features: [],
          faqs: [],
        }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('fromLabel is required');
    });

    it('POST /route-data without toLabel returns 400 with toLabel is required', async () => {
      const res = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'route-no-to',
          fromLabel: 'دمياط',
          title: 'رحلة',
          description: 'وصف',
          metaTitle: 'ميتا',
          metaDescription: 'وصف ميتا',
          heroImage: 'h.jpg',
          priceStart: '100',
          distance: '10 كم',
          duration: 'ساعة',
          features: [],
          faqs: [],
        }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('toLabel is required');
    });

    it('PUT /route-data/:id with whitespace-only fromLabel returns 400 with fromLabel must not be empty', async () => {
      // Given: an existing route so the PUT targets a real row.
      const created = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'route-put-valid',
          fromLabel: 'دمياط',
          toLabel: 'القاهرة',
          title: 'رحلة',
          description: 'وصف',
          metaTitle: 'ميتا',
          metaDescription: 'وصف ميتا',
          heroImage: 'h.jpg',
          priceStart: '100',
          distance: '10 كم',
          duration: 'ساعة',
          features: [],
          faqs: [],
        }),
      });
      expect(created.status).toBe(200);

      // When: a PUT tries to blank out fromLabel with whitespace.
      const res = await adminCrud.request('/route-data/route-put-valid', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ fromLabel: '   ' }),
      });

      // Then: the server rejects it and the stored label is untouched.
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('fromLabel must not be empty');
      const list = await adminCrud.request('/route-data', { headers: { cookie: COOKIE } });
      const listBody = (await list.json()) as Array<{ id: string; fromLabel: string }>;
      const route = listBody.find((r) => r.id === 'route-put-valid');
      expect(route?.fromLabel).toBe('دمياط');
    });

    it('PUT /route-data/:id with only title preserves metaTitle/metaDescription/heroImage/priceStart/faqs', async () => {
      // Given: a route carrying non-empty recovered fields and a non-empty faqs array.
      const faqs = [
        { question: 'هل الخدمة متاحة يومياً؟', answer: 'نعم، يومياً من السادسة صباحاً' },
      ];
      const created = await adminCrud.request('/route-data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'route-partial',
          fromLabel: 'دمياط',
          toLabel: 'القاهرة',
          title: 'العنوان الأصلي',
          description: 'وصف أصلي',
          metaTitle: 'ميتا أصلي',
          metaDescription: 'وصف ميتا أصلي',
          heroImage: 'data:image/jpeg;base64,QUJD',
          priceStart: '250',
          distance: '200 كم',
          duration: '3 ساعات',
          features: ['مكيف'],
          faqs,
        }),
      });
      expect(created.status).toBe(200);

      // When: a partial PUT mentions only title.
      const updated = await adminCrud.request('/route-data/route-partial', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ title: 'العنوان المحدث' }),
      });
      expect(updated.status).toBe(200);

      // Then: title changed while every unmentioned column stays byte-identical.
      const list = await adminCrud.request('/route-data', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<Record<string, unknown>>;
      const route = body.find((r) => r.id === 'route-partial');
      expect(route).toBeDefined();
      expect(route?.title).toBe('العنوان المحدث');
      expect(route?.metaTitle).toBe('ميتا أصلي');
      expect(route?.metaDescription).toBe('وصف ميتا أصلي');
      expect(route?.heroImage).toBe('data:image/jpeg;base64,QUJD');
      expect(route?.priceStart).toBe('250');
      expect(route?.faqs).toEqual(faqs);
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

    it('POST /locations without type defaults to travel with a generated id', async () => {
      const res = await adminCrud.request('/locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ name: 'القاهرة الجديدة', nameAr: 'القاهرة الجديدة' }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/locations', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{ id: string; name: string; nameAr: string; type: string }>;
      const loc = body.find((l) => l.nameAr === 'القاهرة الجديدة');
      expect(loc?.type).toBe('travel');
      expect(typeof loc?.id).toBe('string');
      expect(loc?.id.length).toBeGreaterThan(0);
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

    it('POST /route-groups with pricing persists pricing (create writes pricing)', async () => {
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
          pricing: {
            sedan: { oneWay: 100, roundTrip: 180 },
            suv: { oneWay: 120, roundTrip: 200 },
            family_cruiser: { oneWay: 150, roundTrip: 250 },
            minibus: { oneWay: 200, roundTrip: 320 },
          },
        }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/route-groups', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{
        id: string;
        pricing: { sedan: { oneWay: number; roundTrip: number } };
      }>;
      const group = body.find((r) => r.id === 'rg-1');
      expect(group?.pricing.sedan.oneWay).toBe(100);
      expect(group?.pricing.sedan.roundTrip).toBe(180);
    });
  });

  describe('locations PUT', () => {
    async function createLocation(id: string): Promise<void> {
      const res = await adminCrud.request('/locations', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ id, name: 'Cairo', nameAr: 'القاهرة', type: 'travel' }),
      });
      expect(res.status).toBe(200);
    }

    it('S1: PUT /locations/:id with new name persists and GET shows it', async () => {
      await createLocation('loc-put-1');

      const res = await adminCrud.request('/locations/loc-put-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ name: 'New' }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/locations', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{ id: string; name: string }>;
      const loc = body.find((l) => l.id === 'loc-put-1');
      expect(loc?.name).toBe('New');
    });

    it('S2: PUT with invalid type returns 400 and DB unchanged', async () => {
      await createLocation('loc-put-2');

      const res = await adminCrud.request('/locations/loc-put-2', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ type: 'invalid' }),
      });
      expect(res.status).toBe(400);
      const errBody = (await res.json()) as { error: string };
      expect(typeof errBody.error).toBe('string');

      // DB unchanged: name still original.
      const list = await adminCrud.request('/locations', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{ id: string; name: string }>;
      const loc = body.find((l) => l.id === 'loc-put-2');
      expect(loc?.name).toBe('Cairo');
    });

    it('S3: PUT /locations/:id without a session cookie returns 401', async () => {
      const res = await adminCrud.request('/locations/loc-put-3', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'New' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('route-group-put', () => {
    const FULL_PRICING = {
      sedan: { oneWay: 100, roundTrip: 180 },
      suv: { oneWay: 120, roundTrip: 200 },
      family_cruiser: { oneWay: 150, roundTrip: 250 },
      minibus: { oneWay: 200, roundTrip: 320 },
    };

    async function createGroup(id: string): Promise<void> {
      const res = await adminCrud.request('/route-groups', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id,
          type: 'travel',
          nameAr: 'خط',
          bidirectional: true,
          fromLocations: ['loc-1'],
          toLocations: ['loc-2'],
          pricing: FULL_PRICING,
        }),
      });
      expect(res.status).toBe(200);
    }

    it('S1: PUT /route-groups/:id with new pricing persists and GET shows it', async () => {
      await createGroup('rg-put-1');

      const newPricing = {
        sedan: { oneWay: 111, roundTrip: 222 },
        suv: { oneWay: 333, roundTrip: 444 },
        family_cruiser: { oneWay: 555, roundTrip: 666 },
        minibus: { oneWay: 777, roundTrip: 888 },
      };
      const res = await adminCrud.request('/route-groups/rg-put-1', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'rg-put-1',
          type: 'travel',
          nameAr: 'خط محدث',
          bidirectional: false,
          fromLocations: ['loc-1'],
          toLocations: ['loc-2'],
          pricing: newPricing,
        }),
      });
      expect(res.status).toBe(200);

      const list = await adminCrud.request('/route-groups', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{
        id: string;
        nameAr: string;
        bidirectional: boolean;
        pricing: {
          sedan: { oneWay: number; roundTrip: number };
          suv: { oneWay: number; roundTrip: number };
          family_cruiser: { oneWay: number; roundTrip: number };
          minibus: { oneWay: number; roundTrip: number };
        };
      }>;
      const group = body.find((r) => r.id === 'rg-put-1');
      expect(group?.nameAr).toBe('خط محدث');
      expect(group?.bidirectional).toBe(true);
      expect(group?.pricing).toEqual(newPricing);
    });

    it('S2: PUT with negative price returns 400 and DB unchanged (rollback)', async () => {
      await createGroup('rg-put-2');

      const res = await adminCrud.request('/route-groups/rg-put-2', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({
          id: 'rg-put-2',
          type: 'travel',
          nameAr: 'خط',
          bidirectional: true,
          fromLocations: ['loc-1'],
          toLocations: ['loc-2'],
          pricing: {
            ...FULL_PRICING,
            sedan: { oneWay: -5, roundTrip: 180 },
          },
        }),
      });
      expect(res.status).toBe(400);
      const errBody = (await res.json()) as { error: string };
      expect(typeof errBody.error).toBe('string');

      // DB unchanged: nameAr still original, pricing still original.
      const list = await adminCrud.request('/route-groups', { headers: { cookie: COOKIE } });
      const body = (await list.json()) as Array<{
        id: string;
        nameAr: string;
        pricing: { sedan: { oneWay: number; roundTrip: number } };
      }>;
      const group = body.find((r) => r.id === 'rg-put-2');
      expect(group?.nameAr).toBe('خط');
      expect(group?.pricing.sedan.oneWay).toBe(100);
    });

    it('S3: DELETE /route-groups/:id cascades pricing (0 rows remain)', async () => {
      await createGroup('rg-put-3');

      const res = await adminCrud.request('/route-groups/rg-put-3', {
        method: 'DELETE',
        headers: { cookie: COOKIE },
      });
      expect(res.status).toBe(200);

      const count = db
        .prepare('SELECT COUNT(*) AS n FROM route_pricing WHERE route_group_id = ?')
        .get('rg-put-3') as { n: number };
      expect(count.n).toBe(0);

      const groupCount = db
        .prepare('SELECT COUNT(*) AS n FROM route_groups WHERE id = ?')
        .get('rg-put-3') as { n: number };
      expect(groupCount.n).toBe(0);
    });
  });

  describe('pricing-config-admin', () => {
    it('S1: POST {whatsappNumber} returns 200 and GET /pricing returns normalized', async () => {
      const post = await adminCrud.request('/pricing-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ key: 'whatsappNumber', value: '+20 100-123 4567 ' }),
      });
      expect(post.status).toBe(200);

      const get = await publicApi.request('/pricing');
      expect(get.status).toBe(200);
      const data = (await get.json()) as { pricingConfig: { whatsappNumber: string } };
      expect(data.pricingConfig.whatsappNumber).toBe('+201001234567');
    });

    it('S2: POST {whatsappNumber, value:"abc"} returns 400 and DB unchanged', async () => {
      const res = await adminCrud.request('/pricing-config', {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: COOKIE },
        body: JSON.stringify({ key: 'whatsappNumber', value: 'abc' }),
      });
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe('invalid whatsappNumber');
      const row = db
        .prepare('SELECT value FROM pricing_config WHERE key = ?')
        .get('whatsappNumber') as { value: string } | undefined;
      expect(row).toBeUndefined();
    });

    it('S3: legacy keys (currency, currencyAr, contactEmail) all return 400 and DB unchanged', async () => {
      for (const key of ['currency', 'currencyAr', 'contactEmail']) {
        const res = await adminCrud.request('/pricing-config', {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: COOKIE },
          body: JSON.stringify({ key, value: 'test' }),
        });
        expect(res.status).toBe(400);
        const body = (await res.json()) as { error: string };
        expect(body.error).toBe('unsupported pricing key');
      }
      const count = db
        .prepare('SELECT COUNT(*) AS n FROM pricing_config')
        .get() as { n: number };
      expect(count.n).toBe(0);
    });
  });
});
